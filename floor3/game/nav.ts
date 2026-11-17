// Where a person can walk: a 10 cm grid over the floor, each cell free when the player's body (with a hand's width to
// spare) fits there. `route` finds the shortest way between two points (A*), then pulls it taut, so the bot heads for
// corners the way a person cuts them instead of walking a staircase of cells.
import { RADIUS, ROOMS, STATIC_SOLIDS, type Solid } from "./level";

const CELL = 0.1, MARGIN = 0.1;
const X0 = Math.min(...ROOMS.map((r) => r.x0)) - 0.5, Z0 = Math.min(...ROOMS.map((r) => r.z0)) - 0.5;
const X1 = Math.max(...ROOMS.map((r) => r.x1)) + 0.5, Z1 = Math.max(...ROOMS.map((r) => r.z1)) + 0.5;
const NX = Math.ceil((X1 - X0) / CELL), NZ = Math.ceil((Z1 - Z0) / CELL);

function inRoom(x: number, z: number) { return ROOMS.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) || doorway(x, z); }
// the doorways between rooms count as floor
const DOORS: Solid[] = [
  { x0: 10, x1: 11, z0: -0.3, z1: 0.1, y0: 0, y1: 0, name: "bay-door" },
  { x0: 18.0, x1: 19.15, z0: -2.7, z1: -2.3, y0: 0, y1: 0, name: "copy-door" },
  { x0: 29.9, x1: 30.3, z0: -2.4, z1: -0.2, y0: 0, y1: 0, name: "wing-mouth" },
  { x0: 47.9, x1: 48.3, z0: -1.9, z1: -0.7, y0: 0, y1: 0, name: "lobby-door" },
];
function doorway(x: number, z: number) { return DOORS.some((d) => x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1); }

function build(solids: Solid[]): Uint8Array {
  const g = new Uint8Array(NX * NZ);
  const r = RADIUS + MARGIN;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const x = X0 + (i + 0.5) * CELL, z = Z0 + (j + 0.5) * CELL;
    let free = inRoom(x, z);
    if (free) for (const b of solids) {
      if (b.y0 > 1.5 || b.y1 < 0.25) continue;
      const dx = x - Math.max(b.x0, Math.min(x, b.x1)), dz = z - Math.max(b.z0, Math.min(z, b.z1));
      if (dx * dx + dz * dz < r * r) { free = false; break; }
    }
    g[i * NZ + j] = free ? 1 : 0;
  }
  return g;
}
const GRIDS = new Map<string, Uint8Array>();
function grid(extra: Solid[]): Uint8Array {
  const key = extra.map((b) => `${b.x0.toFixed(2)},${b.x1.toFixed(2)},${b.z0.toFixed(2)}`).join("|");
  let g = GRIDS.get(key);
  if (!g) { g = build([...STATIC_SOLIDS, ...extra]); GRIDS.set(key, g); }
  return g;
}
const cellOf = (x: number, z: number): [number, number] => [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)];
const centre = (i: number, j: number): [number, number] => [X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL];

function nearestFree(g: Uint8Array, i: number, j: number): [number, number] {
  if (g[i * NZ + j]) return [i, j];
  for (let r = 1; r < 30; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
    const a = i + di, b = j + dj;
    if (a >= 0 && b >= 0 && a < NX && b < NZ && g[a * NZ + b]) return [a, b];
  }
  return [i, j];
}
function clear(g: Uint8Array, a: [number, number], b: [number, number]): boolean {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / (CELL * 0.5));
  for (let k = 0; k <= n; k++) {
    const t = k / Math.max(1, n);
    const [i, j] = cellOf(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    if (i < 0 || j < 0 || i >= NX || j >= NZ || !g[i * NZ + j]) return false;
  }
  return true;
}

/** the way from a to b, as corner points (b last), round everything that blocks; `extra` are moving solids */
export function route(a: [number, number], b: [number, number], extra: Solid[] = []): [number, number][] {
  const g = grid(extra);
  const s = nearestFree(g, ...cellOf(a[0], a[1])), t = nearestFree(g, ...cellOf(b[0], b[1]));
  const idx = (i: number, j: number) => i * NZ + j;
  const cost = new Float32Array(NX * NZ).fill(Infinity), from = new Int32Array(NX * NZ).fill(-1);
  const open: [number, number][] = [[0, idx(s[0], s[1])]];
  cost[idx(s[0], s[1])] = 0;
  const h = (k: number) => Math.hypot(Math.floor(k / NZ) - t[0], (k % NZ) - t[1]);
  const goal = idx(t[0], t[1]);
  while (open.length) {
    // a small binary heap would be faster; the grids are small enough for a sorted pop
    let bi = 0;
    for (let q = 1; q < open.length; q++) if (open[q][0] < open[bi][0]) bi = q;
    const [, k] = open[bi];
    open[bi] = open[open.length - 1]; open.pop();
    if (k === goal) break;
    const i = Math.floor(k / NZ), j = k % NZ;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const a2 = i + di, b2 = j + dj;
      if (a2 < 0 || b2 < 0 || a2 >= NX || b2 >= NZ || !g[idx(a2, b2)]) continue;
      if (di && dj && (!g[idx(i + di, j)] || !g[idx(i, j + dj)])) continue;
      const k2 = idx(a2, b2), c = cost[k] + (di && dj ? Math.SQRT2 : 1);
      if (c < cost[k2]) { cost[k2] = c; from[k2] = k; open.push([c + h(k2), k2]); }
    }
  }
  if (from[goal] < 0 && goal !== idx(s[0], s[1])) return [b];
  const cells: [number, number][] = [];
  for (let k = goal; k >= 0; k = from[k]) cells.push(centre(Math.floor(k / NZ), k % NZ));
  cells.reverse();
  // pull taut: keep a point only when the straight line past it would cut a corner
  const out: [number, number][] = [];
  let anchor: [number, number] = a;
  for (let q = 1; q < cells.length; q++) {
    if (!clear(g, anchor, cells[q])) { out.push(cells[q - 1]); anchor = cells[q - 1]; }
  }
  out.push(b);
  return out;
}
