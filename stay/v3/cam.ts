// v3's cameras. the director, 11-11: "the aniamtions and camera movements are so fuckign bad ... completely rip out timing and
// camera". The old ones blended between two aimed views, so a camera slid and swung at once and its speed was whatever
// the blend made it. Here a camera is a dolly: it starts at a point, heads one way, and travels at one velocity for
// as long as the shot (or the take, across cuts) runs; it may pan or tilt at a steady few degrees a second and its lens
// may creep. Nothing eases, so it is moving at every cut, and its numbers can be read before anything is rendered.
import type { V3 } from "../v2/math";

export type Dolly = { eye: V3; /** heading: degrees clockwise from -z seen from above */ yaw: number; /** degrees up */ pitch: number; /** metres a second */ vel: V3; /** degrees a second */ pan?: number; tilt?: number; fov: number; /** degrees a second */ zoom?: number };
export type Cam = { eye: V3; look: V3; fov: number };
const rad = Math.PI / 180;
export const dirOf = (yaw: number, pitch: number): V3 => [Math.sin(yaw * rad) * Math.cos(pitch * rad), Math.sin(pitch * rad), -Math.cos(yaw * rad) * Math.cos(pitch * rad)];
export function camAt(d: Dolly, t: number): Cam {
  const eye: V3 = [d.eye[0] + d.vel[0] * t, d.eye[1] + d.vel[1] * t, d.eye[2] + d.vel[2] * t];
  const f = dirOf(d.yaw + (d.pan ?? 0) * t, d.pitch + (d.tilt ?? 0) * t);
  return { eye, look: [eye[0] + f[0] * 10, eye[1] + f[1] * 10, eye[2] + f[2] * 10], fov: d.fov + (d.zoom ?? 0) * t };
}
/** a dolly that starts at `eye` looking at `at`, written without working the angles out by hand */
export function dolly(eye: V3, at: V3, vel: V3, fov: number, more: Partial<Dolly> = {}): Dolly {
  const d = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]], l = Math.hypot(d[0], d[2]);
  return { eye, yaw: Math.atan2(d[0], -d[2]) / rad, pitch: Math.atan2(d[1], l) / rad, vel, fov, ...more };
}
/** the numbers of a move: its speed (m/s) and how fast the picture turns (degrees a second) */
export const numbers = (d: Dolly) => ({ speed: Math.hypot(...d.vel), turn: Math.hypot(d.pan ?? 0, d.tilt ?? 0), zoom: Math.abs(d.zoom ?? 0) });
