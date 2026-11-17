// The pixel world's splats and sky (v3/pixel.tsx; the director, 11-11: "maybe one could be a pixel art gaussian splat world").
// A meadow at dusk by a lake: a dirt path to the door, pines rising into a wood on the left and along the far shore,
// long shadows from a low sun ahead on the right, fireflies, and the lake holding the sky. Every splat takes a colour
// of the world's palette (v3/pixel-layout.ts), as a pixel artist would paint it; the scene draws them and snaps the
// frame to the same palette in big pixels. Writes:
//   media/splat/pixel-land.splat    the ground, the path, grass, flowers, rocks, the pines and the ridge beyond
//   media/splat/pixel-lake.splat    the water (its middle put on the click: the ripple runs out from a file's middle)
//   media/splat/pixel-flies.splat   the fireflies (their own file, so they pulse)
//   media/sky/pixel-sky.png         the sky card: bands from indigo to amber, the sun, clouds, three ranges of mountains
//   bun tools/pixel-world.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { CARD, CLICK, LAKE, PALETTE, RINGS, RZ, SUN, ground, hex, lakeE, pathX, rnd, vn, type V3 } from "../v3/pixel-layout";

const ROOT = new URL("..", import.meta.url).pathname;
const C = Object.fromEntries(PALETTE.map((h) => [h, hex(h)])) as Record<string, V3>;
type Sp = { p: V3; s: V3; c: V3; a: number };

function write(name: string, sp: Sp[]) {
  const b = new ArrayBuffer(sp.length * 32), dv = new DataView(b), u8 = new Uint8Array(b);
  sp.forEach((x, i) => {
    const o = i * 32;
    x.p.forEach((v, k) => dv.setFloat32(o + 4 * k, v, true));
    x.s.forEach((v, k) => dv.setFloat32(o + 12 + 4 * k, v, true));
    u8.set([x.c[0], x.c[1], x.c[2], Math.round(x.a * 255)], o + 24);
    u8.set([255, 128, 128, 128], o + 28);                        // (no turn: w 1)
  });
  mkdirSync(`${ROOT}media/splat`, { recursive: true });
  writeFileSync(`${ROOT}media/splat/${name}`, u8);
  console.log(`wrote media/splat/${name}: ${sp.length} splats`);
}

// ---- the sky's bands, by how high above the horizon (degrees), warmer toward the sun ----------------------------------
const BANDS: [number, string][] = [[34, "#1b1340"], [26, "#2b1e4f"], [19, "#3b1f5c"], [13, "#6a2c70"], [8.5, "#b83b5e"], [5, "#e86a92"], [2.5, "#f08a5d"], [-90, "#f9b45b"]];
const SUN_AZ = (Math.atan2(SUN[0], -SUN[2]) * 180) / Math.PI, SUN_EL = 3.6;
function band(el: number, az: number, dither: number) {
  const near = Math.max(0, 1 - Math.hypot(az - SUN_AZ, (el - SUN_EL) * 1.6) / 30);
  const e = el - 4.5 * near;                                       // (the glow round the sun pulls the warm bands up)
  for (let k = 0; k < BANDS.length; k++) {
    const top = BANDS[k][0];
    if (e >= top) {
      // a dithered edge: within half a degree above a band's foot, every other pixel takes the band below
      if (k + 1 < BANDS.length && e - top < 0.55 && dither) return BANDS[k + 1][1];
      return BANDS[k][1];
    }
  }
  return BANDS[BANDS.length - 1][1];
}
// a ridge line in degrees above the horizon, by azimuth, with a saddle where the sun goes down
const ridge = (az: number, base: number, amp: number, f: number, seed: number) =>
  (base + amp * (0.62 * vn(az * f + seed, seed) + 0.28 * vn(az * f * 2.7 + seed, seed + 3) + 0.1 * vn(az * f * 7 + seed, seed + 7))) * (1 - 0.72 * Math.exp(-(((az - SUN_AZ) / 11) ** 2)));
const RANGES = [
  { base: 3.0, amp: 7.5, f: 0.05, seed: 11, body: "#8f7fb3", rim: "#e86a92" },
  { base: 1.8, amp: 5.2, f: 0.08, seed: 23, body: "#6b5b95", rim: "#b83b5e" },
  { base: 0.2, amp: 2.8, f: 0.13, seed: 37, body: "#45426e", rim: "#6a2c70" },
];
const CLOUDS = [{ az: -30, el: 13, w: 16, h: 1.6 }, { az: -8, el: 17.5, w: 12, h: 1.2 }, { az: 30, el: 11, w: 14, h: 1.4 }, { az: 50, el: 16, w: 10, h: 1.0 }, { az: 6, el: 8.5, w: 8, h: 0.8 }, { az: -48, el: 8, w: 9, h: 0.9 }];

function paintSky() {
  const [W, H] = CARD.px;
  const px = new Uint8Array(W * H * 3);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = -CARD.w / 2 + ((i + 0.5) / W) * CARD.w, y = CARD.y1 - ((j + 0.5) / H) * (CARD.y1 - CARD.y0);
    const d = Math.hypot(-CARD.z, x);
    const el = (Math.atan2(y - 1.45, d) * 180) / Math.PI, az = (Math.atan2(x, -CARD.z) * 180) / Math.PI;
    const dither = (i + j) % 2;
    let c = band(el, az, dither);
    for (const k of CLOUDS) {
      const u = (az - k.az) / k.w, v = (el - k.el) / k.h;
      const edge = 1 - 0.35 * vn(az * 0.9, k.el) - 0.25 * vn(az * 2.3, k.el + 5);
      if (u * u + v * v * (1 + 0.6 * u * u) < edge * edge) c = v < -0.15 ? (Math.hypot(az - SUN_AZ, el - SUN_EL) < 40 ? "#f9b45b" : "#e86a92") : v < 0.35 ? "#b83b5e" : "#6a2c70";
    }
    const r = Math.hypot(az - SUN_AZ, el - SUN_EL);
    if (r < 4.4) c = r < 3.2 ? "#fff6e0" : r < 3.9 || dither ? "#f9ed69" : c;
    for (const g of RANGES) {
      const top = ridge(az, g.base, g.amp, g.f, g.seed);
      if (el < top) c = el > top - 0.35 && az > SUN_AZ - 45 && az < SUN_AZ + 45 ? g.rim : g.body;
    }
    if (el < -0.4) c = "#2b1e4f";
    px.set(C[c], (j * W + i) * 3);
  }
  mkdirSync(`${ROOT}media/sky`, { recursive: true });
  const ppm = `${ROOT}out/test/pixel-sky.ppm`;
  mkdirSync(`${ROOT}out/test`, { recursive: true });
  writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), Buffer.from(px)]));
  execFileSync("magick", [ppm, `${ROOT}media/sky/pixel-sky.png`]);
  console.log(`wrote media/sky/pixel-sky.png: ${W}x${H}`);
}

// ---- the pines --------------------------------------------------------------------------------------------------------
type Pine = { x: number; z: number; y: number; h: number; r: number };
const PINES: Pine[] = [];
function plant(x: number, z: number, h: number) {
  if (lakeE(x, z) < 1.3) return;
  if (Math.abs(x - pathX(z)) < 1.5 && z > -RZ - 2.5) return;
  if (Math.hypot(x, z + RZ) < 2.2) return;
  if (Math.abs(x) < 2.4 && z > -4.5 && z < 7) return;                                    // (none crowding the lens as it walks)
  if (PINES.some((p) => Math.hypot(p.x - x, p.z - z) < 0.55 * (p.r + h * 0.3))) return;
  PINES.push({ x, z, y: ground(x, z), h, r: h * 0.3 });
}
for (let i = 0; i < 900; i++) {
  const zone = rnd(i, 1);
  let x: number, z: number, h = 2.4 + 3.4 * rnd(i, 4) ** 0.8;
  if (zone < 0.5) { x = -1.7 - 10 * rnd(i, 2) ** 1.3; z = 8 - 24 * rnd(i, 3); }                             // the wood on the left
  else if (zone < 0.75) {                                                                                       // a few small along the far shore,
    x = 0.8 + 11 * rnd(i, 2); z = LAKE.cz - LAKE.rz - 2.5 - 6 * rnd(i, 3); h = 1.4 + 2.0 * rnd(i, 4);
    const az = (Math.atan2(x, 3 - z) * 180) / Math.PI;
    if (Math.abs(az - SUN_AZ) < 8 || (az > -8 && az < 10) || rnd(i, 5) < 0.55) continue;                     // (none before the sun or behind the door)
  } else { x = 7.4 + 6 * rnd(i, 2); z = 7 - 16 * rnd(i, 3); }                                                 // right of the lake
  plant(x, z, h);
}
console.log(`${PINES.length} pines`);
const pineR = (p: Pine, yy: number) => {
  // the crown's radius at height yy above its foot: four tiers, each a skirt narrowing to the next
  const u = (yy - p.h * 0.18) / (p.h * 0.82);
  if (u < 0 || u > 1) return u < 0 && yy > 0 ? 0.07 : 0;
  const tier = Math.min(3, Math.floor(u * 4)), k = u * 4 - tier;
  return p.r * (1 - tier * 0.22) * (1 - 0.72 * k) * (1 - u * 0.25);
};
/** is (x, y, z) in the sun (0), in the shadow of a pine or the door's frame (1), or in the shadow of the door's opening
 *  only (2: shut, it's in the leaf's shadow; open, in the light that comes through) */
function shaded(x: number, y: number, z: number): 0 | 1 | 2 {
  let door = 0;
  if (z > -RZ) {
    // (the door: its frame, or its opening, which the leaf fills until it opens and the next world's light comes through)
    const s = (-RZ - z) / SUN[2], qx = x + SUN[0] * s, qy = y + SUN[1] * s;
    if (Math.abs(qx) < 0.62 && qy > -0.05 && qy < 2.3) door = Math.abs(qx) < DOOR_OPENING.half && qy < DOOR_OPENING.top ? 2 : 1;
  }
  for (let s = 0.15; s < 30; s += 0.18 + s * 0.04) {
    const qx = x + SUN[0] * s, qy = y + SUN[1] * s, qz = z + SUN[2] * s;
    if (qy > 7.5) break;
    for (const p of PINES) {
      const dx = qx - p.x, dz = qz - p.z;
      if (dx * dx + dz * dz > p.r * p.r) continue;
      const r = pineR(p, qy - p.y);
      if (dx * dx + dz * dz < r * r) return 1;
    }
  }
  return door;
}
/** the door's opening as pixel/door.py makes it (the same as sky/door's) */
const DOOR_OPENING = { half: 0.45, top: 2.05 };

// ---- the land -------------------------------------------------------------------------------------------------------
// What lies in the opening's shadow is in two files: in shadow (the door shut) and lit (the light that comes through it
// once it's open, which the scene sweeps in as the leaf swings away from the latch side).
const DOOR_SHADE: Sp[] = [], DOOR_LIT: Sp[] = [];
function land(): Sp[] {
  const out: Sp[] = [];
  /** put a splat whose colour depends on the light where it stands (`col(lit)`) in the right file */
  const put = (sh: number, p: V3, s: V3, col: (lit: boolean) => string) => {
    if (sh === 2) { DOOR_SHADE.push({ p, s, c: C[col(false)], a: 1 }); DOOR_LIT.push({ p: [p[0], p[1] + 0.004, p[2]], s, c: C[col(true)], a: 1 }); }
    else out.push({ p, s, c: C[col(sh === 0)], a: 1 });
  };
  for (let z = 9; z > -18; ) {
    const d = z > -5 ? 0.055 : z > -11 ? 0.1 : 0.18;
    for (let x = -12; x < 14; ) {
      const dx = Math.abs(x) > 8 ? d * 1.5 : d;
      const jx = x + (rnd(Math.round(x * 997), Math.round(z * 991)) - 0.5) * dx * 0.5;
      const e = lakeE(jx, z);
      if (e > 0.92) {
        const y = ground(jx, z);
        const sh = shaded(jx, y + 0.02, z);
        const n = vn(jx * 1.3, z * 1.3), f = rnd(Math.round(jx * 1013), Math.round(z * 1009));
        const onPath = Math.abs(jx - pathX(z)) < 0.42 + 0.12 * vn(z * 2, 5) && z > -RZ - 0.3;
        put(sh, [jx, y, z], [dx * 0.72, 0.012, d * 0.72], (lit) => {
          if (onPath) return f < 0.05 ? "#c2895a" : lit ? (sh === 2 && f < 0.35 ? "#c2895a" : "#8a5a3b") : "#5a3d2b";
          if (e < 1.08) return !lit ? "#5a3d2b" : f < 0.5 ? "#c2895a" : "#8a5a3b";
          if (!lit) return n > 0.55 ? "#1d4a3a" : n > 0.28 ? "#1f3b44" : "#0f2d2a";
          return f < 0.03 ? "#8cc152" : n > 0.62 || sh === 2 ? "#4f9b4f" : n > 0.3 ? "#2e6b47" : "#1d4a3a";
        });
      }
      x += dx;
    }
    z -= d;
  }
  // grass standing up out of the meadow, its tips lit amber where the low sun comes through them, and flowers
  for (let i = 0; i < 26000; i++) {
    const x = -9 + 20 * rnd(i, 21), z = 8.5 - 20 * rnd(i, 22) ** 1.2;
    if (lakeE(x, z) < 1.12 || (Math.abs(x - pathX(z)) < 0.48 && z > -RZ - 0.3)) continue;
    const y = ground(x, z), h = 0.05 + 0.09 * rnd(i, 23), sh = shaded(x, y + h, z);
    const amber = rnd(i, 24) < 0.35;
    put(sh, [x, y + h * 0.4, z], [0.005, h * 0.32, 0.005], (lit) => (lit ? "#4f9b4f" : "#1d4a3a"));
    put(sh, [x + 0.004, y + h * 0.9, z], [0.006, 0.011, 0.006], (lit) => (lit ? (amber ? "#f9b45b" : "#8cc152") : "#2e6b47"));
  }
  for (let i = 0; i < 1800; i++) {
    const side = rnd(i, 31) < 0.5 ? -1 : 1, z = 8 - 13 * rnd(i, 32), x = pathX(z) + side * (0.55 + 3.5 * rnd(i, 33) ** 1.6);
    if (lakeE(x, z) < 1.12) continue;
    const c = ["#e86a92", "#f9ed69", "#fff6e0", "#e86a92", "#f08a5d"][Math.floor(rnd(i, 34) * 5)];
    out.push({ p: [x, ground(x, z) + 0.05 + 0.04 * rnd(i, 35), z], s: [0.009, 0.008, 0.009], c: C[c], a: 1 });
  }
  // rocks by the path and on the shore
  const ROCKS: [number, number, number][] = [[-1.2, 2.6, 0.35], [-0.95, -1.4, 0.25], [1.0, 3.9, 0.3], [0.9, -5.2, 0.45], [5.8, 4.6, 0.5], [-2.4, -5.8, 0.6]];
  ROCKS.forEach(([x, z, r], k) => {
    const y = ground(x, z);
    for (let i = 0; i < 2200 * r; i++) {
      const th = 6.283 * rnd(i, 40 + k), ph = Math.acos(1 - 2 * rnd(i, 50 + k) * 0.55);
      const n: V3 = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      const rr = r * (0.85 + 0.25 * vn(th * 2, ph * 3 + k));
      const lit = n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2];
      const c = lit > 0.45 ? "#f08a5d" : lit > 0.05 ? "#6b6b7a" : n[1] > 0.6 ? "#6b5b95" : "#3d3d4a";
      out.push({ p: [x + n[0] * rr * 1.2, y + n[1] * rr * 0.7 - 0.05, z + n[2] * rr], s: [0.02, 0.02, 0.02], c: C[c], a: 1 });
    }
  });
  // the pines: trunk, then the tiers' skirts, dark where they face us, a rim of gold where they face the sun
  PINES.forEach((p, k) => {
    const far = p.z < -10;
    const st = far ? 0.12 : 0.07;
    for (let yy = 0; yy < p.h * 0.3; yy += 0.05) out.push({ p: [p.x, p.y + yy, p.z], s: [0.05, 0.04, 0.05], c: C[yy > p.h * 0.15 ? "#2b1e4f" : "#5a3d2b"], a: 1 });
    for (let yy = p.h * 0.18; yy < p.h; yy += st * 0.55) {
      const r = pineR(p, yy);
      if (r <= 0.02) continue;
      const n = Math.max(8, Math.round((6.283 * r) / (st * 0.6)));
      const u = (yy - p.h * 0.18) / (p.h * 0.82), kk = u * 4 - Math.min(3, Math.floor(u * 4));
      for (let a = 0; a < n; a++) {
        const th = (a / n) * 6.283 + rnd(k, a) * 0.3;
        const nx = Math.cos(th), nz = Math.sin(th);
        const lit = (nx * SUN[0] + 0.35 * SUN[1] + nz * SUN[2]) / 1.06;
        const c = kk < 0.1 ? "#0f2d2a" : lit > 0.62 ? (rnd(k, a + 7) < 0.6 ? "#f9b45b" : "#8cc152") : lit > 0.25 ? "#2e6b47" : lit > -0.2 ? "#1d4a3a" : "#0f2d2a";
        out.push({ p: [p.x + nx * r, p.y + yy, p.z + nz * r], s: [st * 0.36, st * 0.3, st * 0.36], c: C[c], a: 1 });
        if (rnd(k * 31 + a, 3) < 0.35) out.push({ p: [p.x + nx * r * 0.55, p.y + yy, p.z + nz * r * 0.55], s: [st * 0.45, st * 0.4, st * 0.45], c: C["#0f2d2a"], a: 1 });
      }
    }
  });
  // the ridge beyond the far shore: a long wooded rise, dark against the mountains, its top lit
  // (low enough that the mountains and the setting sun stand over it: its top two or three degrees up from the lens)
  for (let z = -26; z > -60; z -= 0.5) for (let x = -60; x < 60; x += 0.5 + Math.abs(x) * 0.008) {
    const crowns = 0.9 * Math.abs(((x * 0.7 + 3 * vn(x * 0.05, 17)) % 1 + 1) % 1 - 0.5);                          // (its trees' points)
    const top = 1.0 + 1.1 * vn(x * 0.05, 3) + 0.45 * vn(x * 0.17, 9) + crowns * 0.7;
    const y = Math.min(top, (-(z + 26)) * 0.5) - 0.3;
    const rim = top - 0.3 - y < 0.35;
    const az = (Math.atan2(x, 3 - z) * 180) / Math.PI;
    const c = rim ? (Math.abs(az - SUN_AZ) < 22 ? "#b83b5e" : "#6a2c70") : z < -40 ? "#2b1e4f" : "#3b1f5c";
    out.push({ p: [x, y, z], s: [0.24, 0.24, 0.24], c: C[c], a: 1 });
  }
  return out;
}

// ---- the lake --------------------------------------------------------------------------------------------------------
const EYE: V3 = [0, 1.45, 2.0];
function lake(): Sp[] {
  const out: Sp[] = [];
  const farZ = LAKE.cz - LAKE.rz;
  for (let z = LAKE.cz + LAKE.rz; z > farZ; z -= 0.035) {
    for (let x = LAKE.cx - LAKE.rx; x < LAKE.cx + LAKE.rx; x += 0.05) {
      const e = lakeE(x, z);
      if (e > 1.0) continue;
      const D = Math.hypot(x - EYE[0], z - EYE[2]);
      const el = (Math.atan2(EYE[1] - LAKE.y, D) * 180) / Math.PI;
      const az = (Math.atan2(x - EYE[0], EYE[2] - z) * 180) / Math.PI;
      const row = Math.round(z / 0.035), f = rnd(Math.round(x * 731), row);
      let c = band(el, az, (Math.round(x / 0.05) + row) % 2);
      // (near the path we look down into the water more than across it: its own blue, fading out into the sky's
      // reflection over a metre and a half, dithered, as the walk goes by)
      const deep = Math.min(1, Math.max(0, (2.7 - x) / 1.7));
      if (rnd(Math.round(x * 577), row + 77) < deep * 0.9) c = f < 0.55 ? "#1e3a5f" : "#2f6690";
      const shore = z - farZ;
      if (shore < 2.6) c = shore < 1.3 ? "#0f2d2a" : f < 0.5 ? "#1f3b44" : "#0f2d2a";       // (the far shore's pines, upside down)
      const xg = EYE[0] + (EYE[2] - z) * (SUN[0] / -SUN[2]);
      if (Math.abs(x - xg) < 0.25 + 0.05 * (EYE[2] - z) && f > 0.55 && shore > 1.0) c = f > 0.85 ? "#fff6e0" : f > 0.7 ? "#f9ed69" : "#f9b45b";
      else if (f > 0.93) c = D < 4 ? "#4fa3c7" : "#e86a92";                                   // (catches of light on the swell)
      if (e > 0.965 && f > 0.35) c = D < 5 ? "#4fa3c7" : "#e86a92";                          // (the shoreline's lap)
      out.push({ p: [x, LAKE.y, z], s: [0.05, 0.004, 0.026], c: C[c], a: 1 });
    }
  }
  return out;
}
/** the water in rings round the click (pixel-layout RINGS), each its own file whose middle is the click (each axis's
 *  median: a splat's ripple runs out from its file's middle), with clear splats sat there to put it there; the scene
 *  lifts each ring's ripple as the front passes it */
function rings(water: Sp[]): Sp[][] {
  const r = (s: Sp) => Math.hypot(s.p[0] - CLICK[0], s.p[2] - CLICK[2]);
  return RINGS.slice(0, -1).map((r0, k) => {
    const out = water.filter((s) => r(s) >= r0 && r(s) < RINGS[k + 1]);
    const below = (i: 0 | 2) => out.filter((s) => s.p[i] < CLICK[i]).length, above = (i: 0 | 2) => out.filter((s) => s.p[i] > CLICK[i]).length;
    const need = Math.max(Math.abs(below(0) - above(0)), Math.abs(below(2) - above(2))) + 1;
    for (let i = 0; i < need; i++) out.push({ p: [...CLICK], s: [0.001, 0.001, 0.001], c: [0, 0, 0], a: 0 });
    return out;
  });
}

function flies(): Sp[] {
  const out: Sp[] = [];
  for (let i = 0; i < 110; i++) {
    const x = -6 + 11 * rnd(i, 61), z = 7 - 14 * rnd(i, 62);
    if ((lakeE(x, z) < 1.1 && rnd(i, 63) < 0.7) || (Math.abs(x) < 1.4 && z > -4)) continue;
    const y = ground(x, z) + 0.3 + 1.6 * rnd(i, 64);
    out.push({ p: [x, y, z], s: [0.005, 0.005, 0.005], c: C["#fff6e0"], a: 1 });
    out.push({ p: [x, y, z], s: [0.012, 0.012, 0.012], c: C["#f9ed69"], a: 0.35 });
  }
  return out;
}

paintSky();
write("pixel-land.splat", land());
write("pixel-door-shade.splat", DOOR_SHADE);
write("pixel-door-lit.splat", DOOR_LIT);
const water = lake();
rings(water).forEach((r, k) => write(`pixel-lake-${k}.splat`, r));
// the water again, still and a little lower and wider, so the rings' lifted rows never open on nothing
write("pixel-lake-bed.splat", water.map((s) => ({ ...s, p: [s.p[0], s.p[1] - 0.04, s.p[2]] as V3, s: [0.06, 0.004, 0.04] as V3 })));
write("pixel-flies.splat", flies());
