// The film in orbit, shot the way Abrams or Spielberg shoot space: low over the night side with the Earth's limb curving
// across the frame, the sun going down over it under the ship's hull, an anamorphic flare off the sun and the beam's
// port, the hull looming out of frame, and a camera that drifts a little, as if held.
//
//   27-orbit  the beam races up off the Gulf coast and strikes the port: the iris flares, the ship's lights come up
//   28-port   under the port as the beam pours in, the camera pushing at the iris until its light fills the frame
//   32-end    the robot flies past the camera and away, back up to the ship, its thruster streaking the lens; v4: then
//             the camera tilts up off the ship to the stars (NASA's star map), where the logo comes up
//
// Each shot places the Earth and the sun from its key camera (frameOrbit), as a film cheats a planet shot by shot; the
// ship sits at the origin in all of them. Positions are metres in the ship's space (components/ship-plan.ts).
import { AbsoluteFill, interpolate, staticFile } from "raea";
import { Affine2 } from "raea/math";
import { LinearRgba, Srgba } from "raea/color";
import { Mesh3d, Plane3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { LensDistortion } from "raea/post_process";
import { Transform } from "raea/transform";
import { exposed } from "./flare";
import { Mothership, PORT } from "./mothership";
import { Robot } from "./robot";
import type { Lens } from "./shot";
import { Beam, SpaceShot, frameOrbit } from "./space";
import { BeamVolume } from "./beamvol";
import type { Shot2 } from "./take";
import { R_EARTH } from "./earth";
import { T, type V3, clamp, lerp, lerp3 } from "./timeline";

const deg = (d: number) => (d * Math.PI) / 180;
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
const ASPECT = 16 / 9;

/** how each shot places the world: the camera it's composed on (its last frame unless named), where the limb, the sun
 * and the beam's foot fall in that frame, and the shot's light */
type Place = { key?: "start" | "end"; alt: number; limb: number; roll: number; sun: [number, number]; foot: [number, number]; exposure: number; flare: number; shake: number };
export const ORBIT: Record<string, Place> = {
  "27-orbit": { key: "end", alt: 600e3, limb: 13, roll: -7, sun: [0.87, 0.705], foot: [0.3, 0.97], exposure: 2.4, flare: 30, shake: 1.6 },
  "28-port": { key: "start", alt: 600e3, limb: 21, roll: 6, sun: [0.93, 0.36], foot: [0.62, 1.3], exposure: 2.4, flare: 30, shake: 0.8 },
  "32-end": { key: "start", alt: 600e3, limb: 9, roll: -3, sun: [0.8, 0.66], foot: [0.45, 0.95], exposure: 2.4, flare: 26, shake: 0.5 },
};
export const isOrbit = (id: string) => id in ORBIT;

/** a hand on the camera: a slow wander of where it looks and a breath of roll, never still */
function held(cam: Lens, f: number, amp: number): Lens {
  const w = (a: number, b: number) => Math.sin(f * a + b) * 0.6 + Math.sin(f * a * 2.3 + b * 1.7) * 0.4;
  const roll = deg(0.35) * w(0.043, 2.1) * (amp / 1.6);
  return { ...cam, look: [cam.look[0] + amp * w(0.051, 0), cam.look[1] + amp * w(0.067, 1.3), cam.look[2] + amp * w(0.039, 4.2)], up: [Math.sin(roll), Math.cos(roll), 0] };
}

const camOf = (s: Shot2, t: number): Lens => ({ pos: lerp3(s.p0, s.p1, t), look: lerp3(s.l0, s.l1, t), fov: deg(s.fov), near: 0.1 });
/** v4, 32-end: the frame the robot is home by (it reaches the port), the camera's tilt up off the ship to the stars
 *  (from T.tilt, TILT_LEN frames, TILT high: the ship, the Earth and the sun all go out of the frame's foot) */
const HOME = 96, TILT = deg(40), TILT_LEN = 48;
const tiltAt = (f: number) => {
  const u = interpolate(f, [T.tilt, T.tilt + TILT_LEN], [0, 1], clamp);
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
};
/** a camera turned up by `a` about its own right */
function tilted(cam: Lens, a: number): Lens {
  if (a === 0) return cam;
  const d: V3 = [cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]];
  const l = Math.hypot(...d);
  const f = norm3(d);
  const r = norm3([-f[2], 0, f[0]]);
  const u: V3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const n: V3 = [f[0] * Math.cos(a) + u[0] * Math.sin(a), f[1] * Math.cos(a) + u[1] * Math.sin(a), f[2] * Math.cos(a) + u[2] * Math.sin(a)];
  return { ...cam, look: [cam.pos[0] + n[0] * l, cam.pos[1] + n[1] * l, cam.pos[2] + n[2] * l] };
}
/** the stars it tilts up to: NASA's Deep Star Maps 2020 (public domain; scripts/make_starfield.py), a patch of the
 *  real sky made for a plane square to the tilt's last view, STAR_D off: 0.78 of that either side, 0.36 above its
 *  middle and 0.85 below (the patch runs to 1.0 below; cut short of the sun, low in the frame before the tilt) */
const STARS = staticFile("textures/stars/stars-end-v5.png");
const STAR_D = 30000;
/** the stars' light, set on the rendered frame (the forward pass lights an emissive far above the deferred one): the
 *  Milky Way's dust lanes read and the logo over it stays clear. It rises with the tilt as an eye's would. v5: the
 *  texture is v5's, the Milky Way a faint glow behind fine points (make_starfield.py) */
const STAR_NITS = 3;

/** which way the robot's face turns (its wrapper's up): to the camera while it crosses the frame, to the sky as it
 * flies away from it */
function faceUp(r: { at: V3; dir: V3 }, eye: V3): V3 {
  const d = norm3(r.dir);
  const c: V3 = [eye[0] - r.at[0], eye[1] - r.at[1], eye[2] - r.at[2]];
  const along = c[0] * d[0] + c[1] * d[1] + c[2] * d[2];
  const p: V3 = [c[0] - d[0] * along, c[1] - d[1] * along, c[2] - d[2] * along];
  const l = Math.hypot(...p);
  const w = Math.min(1, l / (Math.hypot(...c) * 0.5));
  return norm3([(p[0] / (l || 1)) * w, (p[1] / (l || 1)) * w + (1 - w), (p[2] / (l || 1)) * w]);
}

/** the robot's pose for its own Euler angles (raea doesn't carry an Entity's transform down to the Robot's): its
 * arrow along `dir`, its face toward `up`. The arrow points 22.7 degrees off its frame's +y, so it is turned by that
 * about z, then +y laid onto -z; that, turned as looking along dir with up, read back as XYZ angles. */
function robotPose(dir: V3, up: V3): { tilt: number; spin: number; lean: [number, number] } {
  const z = norm3([-dir[0], -dir[1], -dir[2]]);
  const x = norm3([up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]);
  const y: V3 = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const W = [[x[0], y[0], z[0]], [x[1], y[1], z[1]], [x[2], y[2], z[2]]];
  const c = Math.cos(-0.396), sn = Math.sin(-0.396);
  // Rx(-90) * Rz(-0.396)
  const R = [[c, -sn, 0], [0, 0, 1], [-sn, -c, 0]];
  const M = [0, 1, 2].map((i) => [0, 1, 2].map((j) => W[i][0] * R[0][j] + W[i][1] * R[1][j] + W[i][2] * R[2][j]));
  const b = Math.asin(Math.max(-1, Math.min(1, M[0][2])));
  const a = Math.atan2(-M[1][2], M[2][2]);
  const cc = Math.atan2(-M[0][1], M[0][0]);
  return { tilt: cc, spin: b, lean: [0, a] };
}

/** the beam's tip coming up from the ground: as far from the port as the ground is at first, a hundred metres at the
 * end, closing at an even pace across the frame (the frame shows a far beam's last kilometres, so the pace is even in
 * how far it has left) */
const growAt = (t: number, len: number) => 1 - Math.exp(Math.log(len) * (1 - t)) / len;

/** v4: the beam stands straight down from the port along its axis (the ship's -y), to where that meets the Earth: so it
 * goes in through the middle of the iris, never clipped by the pod's rim, and reads as one straight line up to it */
const DOWN: V3 = [0, -1, 0];
function footUnder(centre: V3): V3 {
  const oc: V3 = [PORT[0] - centre[0], PORT[1] - centre[1], PORT[2] - centre[2]];
  const b = oc[0] * DOWN[0] + oc[1] * DOWN[1] + oc[2] * DOWN[2];
  const c = oc[0] ** 2 + oc[1] ** 2 + oc[2] ** 2 - R_EARTH ** 2;
  const disc = b * b - c;
  if (disc < 0) throw new Error("orbit: the beam's line down from the port misses the Earth");
  const t = -b - Math.sqrt(disc);
  return [PORT[0] + DOWN[0] * t, PORT[1] + DOWN[1] * t, PORT[2] + DOWN[2] * t];
}
/** where a point falls in the frame, as a fraction of its height (0 top, 1 bottom) */
function frameY(cam: Lens, p: V3): number {
  const f = norm3([cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]]);
  const up = cam.up ?? [0, 1, 0];
  const r = norm3([f[1] * up[2] - f[2] * up[1], f[2] * up[0] - f[0] * up[2], f[0] * up[1] - f[1] * up[0]]);
  const u: V3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const v: V3 = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
  const z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
  return 0.5 - (0.5 * (v[0] * u[0] + v[1] * u[1] + v[2] * u[2])) / z / Math.tan(cam.fov / 2);
}
/** how far below the port the beam's head is, so that it climbs the frame at an even pace from below its bottom edge
 * (at frame `from` of the shot) to the port (at `to`) */
/** how far down the port's line stays in front of the lens (a camera looking up has the rest behind it) */
function inFront(cam: Lens, len: number): number {
  const f = norm3([cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]]);
  const ahead = (PORT[0] - cam.pos[0]) * f[0] + (PORT[1] - cam.pos[1]) * f[1] + (PORT[2] - cam.pos[2]) * f[2];
  const sink = -(DOWN[0] * f[0] + DOWN[1] * f[1] + DOWN[2] * f[2]);
  return sink > 0 ? Math.min(len, ahead / sink) : len;
}
function headBelow(cam: Lens, local: number, from: number, to: number, len: number): number {
  const yPort = frameY(cam, PORT);
  const want = interpolate(local, [from, to], [1.12, yPort], clamp);
  const yAt = (d: number) => frameY(cam, [PORT[0] + DOWN[0] * d, PORT[1] + DOWN[1] * d, PORT[2] + DOWN[2] * d]);
  // lower in the frame the further down it is, only as far as the plane the lens stands in: a camera looking up at the
  // ship has the line's far end behind it (it runs off the bottom of the frame long before). Search on a log scale.
  const far = inFront(cam, len) * 0.999;
  let lo = Math.log(0.5), hi = Math.log(far);
  if (yAt(Math.exp(hi)) < want) return len;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (yAt(Math.exp(m)) < want) lo = m; else hi = m;
  }
  return Math.exp((lo + hi) / 2);
}

export function OrbitShot({ f, s, debug = "" }: { f: number; s: Shot2; debug?: string }) {
  const P = ORBIT[s.id];
  const t = (f - s.from) / (s.to - s.from);
  const local = f - s.from;
  const cam = s.id === "32-end" ? tilted(held(camOf(s, t), f, P.shake), TILT * tiltAt(f)) : held(camOf(s, t), f, P.shake);
  const key = camOf(s, P.key === "start" ? 0 : 1);
  const orbit = frameOrbit({ cam: key, aspect: ASPECT, alt: P.alt, limb: P.limb, roll: P.roll, sun: P.sun, foot: P.foot, lat: 30.0, lon: -90.5 });
  const foot = footUnder(orbit.centre);
  const len = Math.hypot(PORT[0] - foot[0], PORT[1] - foot[1], PORT[2] - foot[2]);

  // the beam, the iris it lights, the ship's lights, and the port's flare
  // the port flares only as the beam strikes it (27) and as the camera goes into it (28): one bar, for a moment
  let grow = 1, iris = 1, lights = 1, portK = 0, portReach = 0;
  let robot: { at: V3; dir: V3 } | undefined;
  let white = 0;
  let head: V3 | undefined;
  // while the head climbs, the beam is drawn from where its line leaves the frame (in front of the lens) up to it: the
  // glow's shader needs both of its ends in front of the lens to find the line between them
  // (one place for the whole shot, from its first and last cameras: the glow's uniforms can't change mid-shot)
  const LOW = s.id === "27-orbit" ? Math.min(inFront(camOf(s, 0), len), inFront(camOf(s, 1), len)) * 0.97 : len;
  const low: V3 = [PORT[0] + DOWN[0] * LOW, PORT[1] + DOWN[1] * LOW, PORT[2] + DOWN[2] * LOW];
  let soft: { at: V3; to: V3 } = { at: [0, 0, 0], to: [0, 0, -1] };
  if (s.id === "27-orbit") {
    const strike = 66;
    // v4: the head comes up into the bottom of the frame as the white clears and climbs it, straight, to the port
    if (local < strike) {
      const d = headBelow(cam, local, 8, strike, len);
      // (kept mounted from the first frame, a sliver below the frame until the head comes in: a material first mounted
      // mid-shot may not be ready in a video render)
      grow = d < LOW ? 1 - d / LOW : 1e-4;
      head = [PORT[0] + DOWN[0] * d, PORT[1] + DOWN[1] * d, PORT[2] + DOWN[2] * d];
    } else grow = 1;
    const hit = interpolate(local, [strike - 2, strike + 4, strike + 30], [0, 1, 0.85], clamp);
    iris = local < strike ? 0.05 : hit;
    lights = interpolate(local, [strike + 4, strike + 40], [0.25, 1], clamp);
    const flash = interpolate(local, [strike, strike + 2, strike + 30], [0, 1, 0], clamp);
    portK = 14 * flash;
    portReach = flash;
    // out of the cloud the beam rose into: the white falls away over the first third of a second
    white = interpolate(local, [0, 10], [1, 0], clamp);
  } else if (s.id === "28-port") {
    portK = interpolate(local, [0, s.to - s.from - 16, s.to - s.from - 2], [1.5, 3, 60], clamp);
    portReach = interpolate(local, [s.to - s.from - 16, s.to - s.from - 4], [0, 1], clamp);
    white = interpolate(local, [s.to - s.from - 8, s.to - s.from - 1], [0, 1], clamp);
  } else if (s.id === "32-end") {
    // the beam's gone; the iris waits for it, half lit; the robot from beside the camera up to it, quicker and quicker
    grow = 0;
    iris = 0.25;
    // v4: one clean arc home. It comes from behind the lens on the left, passes it close (nearest, half a metre off, on
    // T.pass, the woosh), and flies on nose first out across the right of the frame, curving the whole way, back in to
    // the middle where the port is, and on into it faster and faster: a speck before the camera tilts to the stars. The
    // near curve at an even speed (by its length), then the leg to the port speeding up from that same speed.
    const c0 = camOf(s, 0).pos;
    const fw = norm3([s.l0[0] - s.p0[0], s.l0[1] - s.p0[1], s.l0[2] - s.p0[2]]);
    const rt = norm3([-fw[2], 0, fw[0]]);
    const pt = (a: number, b: number, c: number): V3 => [c0[0] + fw[0] * a + rt[0] * b, c0[1] + fw[1] * a + c, c0[2] + fw[2] * a + rt[2] * b];
    const to: V3 = [PORT[0], PORT[1] - 3, PORT[2]];
    const S0 = pt(-7, -1.25, -0.45), C1 = pt(3.5, -1.0, -0.3), S1 = pt(10, 2.1, 0.35);
    const toS = norm3([to[0] - S1[0], to[1] - S1[1], to[2] - S1[2]]);
    const C2: V3 = [S1[0] - toS[0] * 5, S1[1] - toS[1] * 5, S1[2] - toS[2] * 5];
    // the softbox behind the lens, over it, lighting its back as it flies away from it
    soft = { at: pt(-0.8, 0.4, 0.9), to: pt(3, -0.6, -0.2) };
    const A1 = 60, B1 = HOME;
    const bez = (u: number): V3 => [0, 1, 2].map((i) => (1 - u) ** 3 * S0[i] + 3 * u * (1 - u) ** 2 * C1[i] + 3 * u * u * (1 - u) * C2[i] + u ** 3 * S1[i]) as V3;
    const M = 240;
    const tab = [0];
    for (let i = 1; i <= M; i++) {
      const a = bez((i - 1) / M), b = bez(i / M);
      tab.push(tab[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    const v0 = tab[M] / A1;
    const L = Math.hypot(to[0] - S1[0], to[1] - S1[1], to[2] - S1[2]);
    const N = B1 - A1;
    // away: d(n) = (v0 / r)(e^(r n) - 1) metres n frames on, r so it ends at the port
    let lo = 1e-4, hi = 1;
    for (let i = 0; i < 60; i++) {
      const r = (lo + hi) / 2;
      if ((v0 / r) * (Math.exp(r * N) - 1) > L) hi = r; else lo = r;
    }
    const r = (lo + hi) / 2;
    const near = (d: number): V3 => {
      let i = 1;
      while (i < M && tab[i] < d) i++;
      return bez(Math.min(1, (i - 1 + (d - tab[i - 1]) / (tab[i] - tab[i - 1] || 1)) / M));
    };
    const path = (fr: number): V3 => {
      if (fr < A1) return near(v0 * Math.max(0, fr));
      const d = Math.min(L, (v0 / r) * (Math.exp(r * Math.min(fr - A1, N)) - 1));
      return [S1[0] + toS[0] * d, S1[1] + toS[1] * d, S1[2] + toS[2] * d];
    };
    const at = path(local);
    const nx = local < A1 ? path(local + 1) : null;
    robot = local < B1 - 0.5 ? { at, dir: nx ? [nx[0] - at[0], nx[1] - at[1], nx[2] - at[2]] : toS } : undefined;
  }

  // the robot's thruster: a point of light behind it, which the lens flares from too
  const tail: V3 | undefined = robot ? (() => {
    const l = Math.hypot(...robot.dir) || 1;
    return [robot.at[0] - (robot.dir[0] / l) * 0.42, robot.at[1] - (robot.dir[1] / l) * 0.42, robot.at[2] - (robot.dir[2] / l) * 0.42] as V3;
  })() : undefined;
  const also = tail
    ? { at: tail, r: 0.004, above: exposed(4e4, P.exposure), k: 4, reach: 0.1 }
    : head
      ? { at: head, r: 0.005, above: exposed(4e4, P.exposure), k: 5, reach: 0.15 }
      : { at: PORT, r: 0.006, above: exposed(20000, P.exposure), k: portK, reach: portReach };

  // v4: the beam's body as a volume (beamvol.tsx), from the ground under the ship up the port's line to its head: the
  // same air and energy as in the swamp, ten times its size, never thinner than an angle from the lens. Blurred across
  // the shutter, half a frame back, with its climb and the camera
  const camAt = (ff: number) => held(camOf(s, (ff - s.from) / (s.to - s.from)), ff, P.shake);
  const reachAt = (ff: number) => {
    if (s.id === "27-orbit") {
      const l = ff - s.from;
      return l < 66 ? Math.max(0, len - headBelow(camAt(ff), l, 8, 66, len)) : len;
    }
    return s.id === "28-port" ? len : 0;
  };
  const reach = reachAt(f);
  const UP: V3 = [-DOWN[0], -DOWN[1], -DOWN[2]];

  return (
    <>
      <SpaceShot cam={cam} orbit={orbit} exposure={P.exposure} aspect={ASPECT} flare={{ sun: P.flare, also }} debug={debug}>
        <Mothership f={f} beam={iris} lights={lights} debug={debug} />
        {grow > 0 && !debug.includes("nobeam") && <Beam from={low} to={PORT} grow={grow} r={0.4} glowK={0} k={debug.includes("nocore") ? 0 : undefined} />}
        {reach > 0 && !debug.includes("novol") && <BeamVolume cam={cam} cam0={camAt(Math.max(s.from, f - 0.5))} foot={foot} axis={UP} h={reach} h0={reachAt(Math.max(s.from, f - 0.5))} t={(f - 0.25) / 30} exposure={P.exposure} aspect={ASPECT} scale={10} ang={0.0016} head={s.id === "27-orbit" && head ? 0.22 : 0} />}
        {head && !debug.includes("nohead") && (
          <Mesh3d name="beam-head" castShadow={false} transform={Transform.fromXyz(...head)}>
            <Sphere radius={2.2} />
            <StandardMaterial base_color="#ffffff" emissive={glow("#eef8ff", 2e5)} />
          </Mesh3d>
        )}
        {robot && tail && (
          <>
            {/* its tip on its path: the robot's own frame turned so its arrow points ahead */}
            {/* (flying away from the lens, its face can't be turned to it: its back is up, as it flies) */}
            <Robot at={robot.at} {...robotPose(robot.dir, faceUp(robot, cam.pos))} f={f} />
            {/* a softbox over the lens's right shoulder, behind it, as a space shot lights its hero: Solari lights by
                directional lights and glowing surfaces only, and a glowing panel lights the robot without touching the
                Earth (drawn raster-lit by the sun alone); a metre square at 45,000 nits, some 5,000 lux at three metres */}
            <Mesh3d name="softbox" castShadow={false} transform={Transform.fromXyz(...soft.at).lookingAt(soft.to)}>
              <Plane3d normal={[0, 0, -1]} half_size={[0.5, 0.5]} />
              <StandardMaterial base_color="#000000" emissive={glow("#dfe8ff", 45000)} />
            </Mesh3d>
            <Mesh3d name="robot-burn" castShadow={false} transform={Transform.fromXyz(...tail)}>
              <Sphere radius={0.03} />
              <StandardMaterial base_color="#ffffff" emissive={glow("#cfe9ff", 6e4)} />
            </Mesh3d>
          </>
        )}
        {/* (v5: never quite 0: rendered to PNG frames, a star plane mounted at 0 kept no texture and stayed black) */}
        {s.id === "32-end" && !debug.includes("nostars") && <StarPlane s={s} k={STAR_NITS * Math.max(1e-4, Math.pow(tiltAt(f), 3))} />}
        {!debug.includes("nolens") && <LensDistortion k1={0.025} />}
      </SpaceShot>
      {white > 0 && <AbsoluteFill style={{ background: "#f4fbff", opacity: white }} />}
    </>
  );
}

/** the stars, mounted from the shot's first frame (dark until the tilt): a plane square to the tilt's last view, its
 *  top the view's up, the real sky's patch on it lit by itself alone (no sun on it, no shine). Drawn in the forward
 *  pass: Solari's deferred lighting leaves a surface this far off (30 km) unlit, black at any emissive */
function StarPlane({ s, k }: { s: Shot2; k: number }) {
  const end = tilted(camOf(s, (T.tilt + TILT_LEN - s.from) / (s.to - s.from)), TILT);
  const F = norm3([end.look[0] - end.pos[0], end.look[1] - end.pos[1], end.look[2] - end.pos[2]]);
  const R = norm3([-F[2], 0, F[0]]);
  const U: V3 = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  const top = 0.36, bottom = 0.85, half = 0.78;
  const mid = (top - bottom) / 2;
  const c: V3 = [0, 1, 2].map((i) => end.pos[i] + F[i] * STAR_D + U[i] * mid * STAR_D) as V3;
  return (
    <Mesh3d name="stars" castShadow={false} transform={Transform.fromXyz(...c).lookingAt([c[0] + F[0], c[1] + F[1], c[2] + F[2]], U)}>
      <Plane3d normal={[0, 0, 1]} half_size={[half * STAR_D, ((top + bottom) / 2) * STAR_D]} />
      <StandardMaterial base_color="#000000" emissive_texture={STARS} emissive={new LinearRgba(k, k, k, 1)} perceptual_roughness={1} reflectance={0} uv_transform={STAR_UV} opaque_render_method="Forward" />
    </Mesh3d>
  );
}
/** the plane shows the patch's top 0.36 + 0.85 of its 1.36 units: the texture's rows from the top, so many */
const STAR_UV = Affine2.fromScale([1, (0.36 + 0.85) / 1.36]);

/** the space shots' cameras, as SHOTS2 rows (ship space, metres) */
export const ORBIT_SHOTS = (t27: number, t28: number, t29: number, t32: number, end: number): Shot2[] => [
  { id: "27-orbit", from: t27, to: t28, p0: [470, -330, 920], p1: [200, -230, 640], l0: [-150, -50, 340], l1: [-170, 10, 330], fov: 42 },
  { id: "28-port", from: t28, to: t29, p0: [-40, -380, 520], p1: [-130, -150, 330], l0: [-170, -40, 260], l1: [PORT[0], PORT[1] + 10, PORT[2]], fov: 46 },
  { id: "32-end", from: t32, to: end, p0: [880, -470, 1460], p1: [878.2, -469.2, 1457.8], l0: [-150, -40, 320], l1: [-156, -36, 316], fov: 32 },
];
