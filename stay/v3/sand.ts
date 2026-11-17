// Sand that moves as sand does. the director, 11-11: "alos make sure that the door opening moves the sand with physics"; and,
// for the dunes, "the relaistic sand simulation like we did for the ui post" (launch post 13-sandbox: a heightfield
// relaxed to sand's angle of repose).
// A patch of sand is a grid of heights. Where a thing moving through it (a door's leaf sweeping out) stands lower than
// the sand, the sand there is cut down to the thing's edge and pushed ahead of its face; then every cell steeper than
// the angle of repose with a neighbour gives that neighbour sand until neither is, so a heap ploughed up slumps and runs
// off as it would. The patch's border is pinned to the seabed around it, so it joins the ground it is cut out of.
// Deterministic: a frame's sand is the patch stepped from its rest to that frame's time, the last one kept, so a render
// running forward pays one frame's steps a frame and a single frame (--at) still gets the same sand.
import type { V3 } from "../v2/math";

export type Patch = {
  /** the grid's first cell's middle (x, z), its cell size, and how many cells across x and z */
  x0: number; z0: number; d: number; nx: number; nz: number;
  /** the ground's height at (x, z): the patch starts as this, and its border keeps it */
  ground: (x: number, z: number) => number;
  /** the steepest a slope stands, as tan of the angle (sand under water: about 30 degrees) */
  repose: number;
  /** cells sand can't go into (the hull's foot): true for a wall */
  wall?: (x: number, z: number) => boolean;
};
/** a thing in the sand at time t: for a point (x, z), how low its underside comes there (null: not there) and the way it
 *  is moving there (where the sand it cuts goes) */
export type Blade = (t: number) => {
  at: (x: number, z: number) => { bottom: number; push: [number, number]; ahead: number } | null;
  /** sand gone from (x, z) this step, metres (into the hollow a thing pulled up out of the sand leaves under it) */
  drain?: (x: number, z: number) => number;
};

type State = { t: number; h: Float32Array };
const KEPT = new WeakMap<Patch, State>();

/** the rest state: the ground, settled, with whatever stands in it at t0 cut out of it */
function rest(p: Patch, blade: Blade, t0: number): Float32Array {
  const h = new Float32Array(p.nx * p.nz);
  for (let j = 0; j < p.nz; j++) for (let i = 0; i < p.nx; i++) h[j * p.nx + i] = p.ground(p.x0 + i * p.d, p.z0 + j * p.d);
  const pin = pinned(p);
  cut(p, h, blade(t0), pin);
  relax(p, h, pin, 160, null);
  return h;
}
const PIN = new WeakMap<Patch, Uint8Array>();
function pinned(p: Patch): Uint8Array {
  let m = PIN.get(p);
  if (m) return m;
  m = new Uint8Array(p.nx * p.nz);
  for (let j = 0; j < p.nz; j++) for (let i = 0; i < p.nx; i++) {
    const x = p.x0 + i * p.d, z = p.z0 + j * p.d;
    m[j * p.nx + i] = i === 0 || j === 0 || i === p.nx - 1 || j === p.nz - 1 ? 1 : p.wall?.(x, z) ? 2 : 0;
  }
  PIN.set(p, m);
  return m;
}
/** cut the sand down to the blade's underside where it stands, and put what it cut ahead of it */
function cut(p: Patch, h: Float32Array, b: ReturnType<Blade>, pin: Uint8Array): Float32Array | null {
  const cap = new Float32Array(p.nx * p.nz).fill(Infinity);
  let any = false;
  for (let j = 1; j < p.nz - 1; j++) for (let i = 1; i < p.nx - 1; i++) {
    const k = j * p.nx + i;
    if (pin[k]) continue;
    const x = p.x0 + i * p.d, z = p.z0 + j * p.d;
    if (b.drain) h[k] -= b.drain(x, z);
    const s = b.at(x, z);
    if (!s) continue;
    cap[k] = s.bottom;
    any = true;
    const over = h[k] - s.bottom;
    if (over <= 0) continue;
    h[k] = s.bottom;
    // (the sand cut goes just past the blade's face, the way it moves: a step at a time until it is clear of it)
    let tx = x, tz = z, kk = -1;
    for (let n = 0; n < 12; n++) {
      tx += s.push[0] * p.d * 0.75; tz += s.push[1] * p.d * 0.75;
      const ti = Math.round((tx - p.x0) / p.d), tj = Math.round((tz - p.z0) / p.d);
      if (ti < 1 || tj < 1 || ti >= p.nx - 1 || tj >= p.nz - 1) break;
      kk = tj * p.nx + ti;
      if (pin[kk] === 2) { kk = -1; break; }
      if (!b.at(tx, tz)) break;
    }
    if (kk >= 0) h[kk] += over;
  }
  return any ? cap : null;
}
/** let every slope steeper than repose slump into the cell below it, `iters` times */
function relax(p: Patch, h: Float32Array, pin: Uint8Array, iters: number, cap: Float32Array | null) {
  const lim = p.repose * p.d, nx = p.nx, nz = p.nz;
  const dh = new Float32Array(h.length);
  const nb = [1, -1, nx, -nx];
  for (let it = 0; it < iters; it++) {
    dh.fill(0);
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      if (pin[k] === 2) continue;
      for (const o of nb) {
        const m = k + o;
        if (pin[m] === 2) continue;
        const room = cap ? cap[m] - h[m] : Infinity;
        const ex = h[k] - h[m] - lim;
        if (ex > 0 && room > 0) {
          const q = Math.min(ex * 0.2, room * 0.5);
          dh[k] -= q;
          if (pin[m] !== 1) dh[m] += q;                 // (sand that runs off the patch's border is gone into the ground beyond)
        }
      }
    }
    for (let k = 0; k < h.length; k++) if (pin[k] !== 1) h[k] += dh[k];
  }
}

/** the patch's heights at time t: stepped from rest (t0) `sub` times a frame (30 fps), relaxing `iters` times a step */
export function sandAt(p: Patch, blade: Blade, t0: number, t: number, sub = 4, iters = 6): Float32Array {
  const pin = pinned(p);
  let s = KEPT.get(p);
  if (!s || s.t > t + 1e-6) s = { t: t0, h: rest(p, blade, t0) };
  const dt = 1 / 30 / sub;
  let h = s.h.slice();
  let now = s.t;
  while (now < t - 1e-6) {
    now = Math.min(t, now + dt);
    const cap = cut(p, h, blade(now), pin);
    relax(p, h, pin, iters, cap);
  }
  KEPT.set(p, { t: now, h });
  return h;
}

/** the patch as a mesh: positions, normals, uvs (the seabed's: world x and z over `tile` metres) and indices, `lift` above */
export function sandMesh(p: Patch, h: Float32Array, tile: number, zUv: number, lift = 0.004) {
  const { nx, nz, d } = p;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  const H = (i: number, j: number) => h[Math.min(nz - 1, Math.max(0, j)) * nx + Math.min(nx - 1, Math.max(0, i))];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = p.x0 + i * d, z = p.z0 + j * d;
    positions.push(x, H(i, j) + lift, z);
    const gx = (H(i + 1, j) - H(i - 1, j)) / (2 * d), gz = (H(i, j + 1) - H(i, j - 1)) / (2 * d);
    const l = Math.hypot(gx, 1, gz);
    normals.push(-gx / l, 1 / l, -gz / l);
    uvs.push(x / tile, (z + zUv) / tile);
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, e = c + 1;
    indices.push(a, c, b, b, c, e);
  }
  return { positions, normals, uvs, indices };
}

/** how much sand moved between two heights (metres of sand, summed over the patch): what kicks the silt up */
export function moved(a: Float32Array, b: Float32Array): number { let s = 0; for (let k = 0; k < a.length; k++) s += Math.abs(a[k] - b[k]); return s; }
export type { V3 };
