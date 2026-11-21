// The Hochbahn stations' stairs, from the 1902 descriptions. Prometheus (13, no. 639, 1902, p. 231) gives Möckernbrücke
// as the typical station: "Nach dem einen Kopfende der Bahnsteige führt eine 5 m breite Treppe zunächst nach einem
// Podest mit Fahrkartenausgabe, wo sich die Treppe zum Abfahrts- und Ankunftsbahnsteig theilt"; Siemens & Halske's
// Festschrift (1902) gives each platform's flight as 2 to 2.5 m wide (FLIGHT), and its plate of Möckernbrücke shows the
// flights roofed beside the deck at the hall's end and a small house at street level under the viaduct. So, at a
// typical station:
//   - from each side platform's end a flight FLIGHT m wide runs on down beyond it, outside the girders, under a roof
//     with its outer wall, to the landing (Podest) LANDING m over the street (ASSUMED: under the deck's 4.55 m, with
//     headroom), at RISE by TREAD a step (ASSUMED: the steps' proportion is not given);
//   - the landing runs across the line, POD m long, with the ticket booth (BOOTH) in its middle;
//   - and the main stair, MAIN m wide on the line's axis, runs on down from it to the street.
// Which head end is not given: the one opening on the crossing street (the stations stood at crossings, Prometheus),
// read as the end with more open ground across the line (no building, no water) within REACH m beyond it (ASSUMED).
// Prometheus names the stations built otherwise: Stralauer Tor (its stair changed for the Oberbaumbrücke), Schlesisches
// Tor, Hallesches Tor, Bülowstrasse and Nollendorfplatz (their own architects' buildings), and the Festschrift's plate
// shows Prinzenstrasse's stair house on the corner with a covered bridge to its platform. Their access is their own
// buildings (stations.sh and bands.sh keep them); where such a stair house stands off the platform, a covered bridge
// BRIDGE_W m wide joins it at the platform's level. Warschauer Brücke (the terminus, with its station building) and
// Gleisdreieck (rebuilt on two levels in 1912) are built otherwise too, and have no stairs drawn here.
import { fill, polygons } from "./raster";

export const FLIGHT = 2.5, MAIN = 5, LANDING = 2, RISE = 0.16, TREAD = 0.3, POD = 3, BOOTH = 2.2, ROOF = 2.6, WALL = 0.2;
export const BRIDGE_W = 3, BRIDGE_H = 2.6, LOOK = 40, REACH = 30, ACROSS = 40;
const OWN = new Set(["Stralauer Tor", "Schlesisches Tor", "Hallesches Tor", "Bülowstraße", "Nollendorfplatz", "Prinzenstraße", "Warschauer Brücke", "Gleisdreieck"]);

type V = number[];
export type Hall = { name: string; i: number; l: { pts: V[]; rail: number[] } };
export type Box = (a: V, b: V, w: number, za: V, zb: V, col: V, s?: number) => void;
export type Kit = { PLATFORM: number; STEP: number; UP: number; PLAT_IN: number; PLAT_OUT: number; CLEAR: number; DEPTH: number };

export async function stairs(halls: Hall[], sheets: { bbox: number[]; map: string }[], box: Box, col: { step: V; wall: V }, k: Kit) {
  const report: string[] = [];
  for (const { name, i, l } of halls) {
    const { pts, rail } = l, h = Math.round(k.PLATFORM / 2 / k.STEP), [cx, cy] = pts[i];
    // the ground round the station: 1 a building, 2 water, at 1 m
    const R = LOOK + k.PLATFORM / 2 + REACH + ACROSS, t = { id: "stairs", x0: cx - R, y0: cy - R, x1: cx + R, y1: cy + R, mpp: 1 };
    const W = 2 * R, r = new Uint8Array(W * W), houses: V[][] = [];
    for (const s of sheets) {
      const [a, b, c, d] = s.bbox;
      if (c < t.x0 || a > t.x1 || d < t.y0 || b > t.y1) continue;
      for (const [f, val] of [["buildings", 1], ["water", 2]] as const) {
        const file = Bun.file(`${s.map}/${f}.geojson`);
        if (!(await file.exists())) continue;
        const fs = (await file.json()).features as any[];
        fill(r, t, fs.flatMap((x) => polygons(x.geometry)), val);
        if (f === "buildings") for (const x of fs) if (x.properties?.storeys_from === "station") houses.push(...polygons(x.geometry).map((p: any) => p[0] as V[]));
      }
    }
    const at = (x: number, y: number) => { const u = Math.floor(x - t.x0), v = Math.floor(t.y1 - y); return u >= 0 && v >= 0 && u < W && v < W ? r[v * W + u] : 1; };
    if (OWN.has(name)) {
      report.push(`${name}: its own buildings`);
      // a stair house off the platform (not the base the station point falls in): a covered bridge at the platform's level
      for (const ring of houses) {
        if (inside([cx, cy], ring)) continue;
        let best: { d: number; q: V; j: number; s: number } | null = null;
        for (let j = Math.max(0, i - h); j <= Math.min(pts.length - 1, i + h); j++) {
          const [ax, ay] = pts[j], [bx, by] = pts[Math.min(pts.length - 1, j + 1)], L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L;
          for (const s of [1, -1]) {
            const e = [ax + nx * s * k.PLAT_OUT, ay + ny * s * k.PLAT_OUT], q = nearest(e, ring), d = Math.hypot(q[0] - e[0], q[1] - e[1]);
            if (d <= LOOK && (!best || d < best.d)) best = { d, q, j, s };
          }
        }
        if (!best || best.d < 0.5) continue;
        const { q, j, s } = best, [ax, ay] = pts[j], [bx, by] = pts[Math.min(pts.length - 1, j + 1)], L = Math.hypot(bx - ax, by - ay) || 1;
        const e = [ax - ((by - ay) / L) * s * k.PLAT_OUT, ay + ((bx - ax) / L) * s * k.PLAT_OUT], pf = rail[j] + k.UP;
        box(e, q, BRIDGE_W, [pf - 0.4, pf + BRIDGE_H], [pf - 0.4, pf + BRIDGE_H], col.wall);
        report.push(`${name}: a covered bridge ${best.d.toFixed(1)} m to its stair house`);
      }
      continue;
    }
    // the head end opening on the crossing street: more open ground across the line within REACH m beyond it
    const ends = [[Math.min(pts.length - 1, i + h), 1], [Math.max(0, i - h), -1]].filter(([e, o]) => e + o * Math.ceil(REACH / k.STEP) >= 0 && e + o * Math.ceil(REACH / k.STEP) < pts.length);
    if (!ends.length) { report.push(`${name}: no room for its stairs on the drawn line`); continue; }
    const open = ([e, o]: number[]) => {
      const [ux, uy] = dir(pts, e, o);
      let n = 0;
      for (let d = 6; d <= REACH; d += 6) for (let s = 6; s <= ACROSS; s += 2) for (const side of [1, -1]) {
        const x = pts[e][0] + ux * d - uy * side * s, y = pts[e][1] + uy * d + ux * side * s;
        if (!at(x, y)) n++;
      }
      return n;
    };
    const [e, o] = ends.reduce((a, b) => (open(b) > open(a) ? b : a));
    const [ux, uy] = dir(pts, e, o), E = pts[e], pf = rail[e] + k.UP, g = rail[e] - k.CLEAR - k.DEPTH, land = g + LANDING;
    const along = (d: number) => [E[0] + ux * d, E[1] + uy * d];
    // the flights: one step a box, the roof and the outer wall on the slope
    const n = Math.round((pf - land) / RISE), L1 = n * TREAD;
    for (const s of [1, -1]) {
      const off = s * (k.PLAT_IN + FLIGHT / 2);
      for (let q = 0; q < n; q++) box(along(q * TREAD), along((q + 1) * TREAD), FLIGHT, [pf - (q + 1) * RISE - 0.3, pf - (q + 1) * RISE], [pf - (q + 1) * RISE - 0.3, pf - (q + 1) * RISE], col.step, -off * o);
      box(along(0), along(L1), FLIGHT + 2 * WALL, [pf + ROOF, pf + ROOF + 0.2], [land + ROOF, land + ROOF + 0.2], col.wall, -off * o);
      box(along(0), along(L1), WALL, [g, pf + ROOF], [g, land + ROOF], col.wall, -(off + s * (FLIGHT / 2 + WALL / 2)) * o);
    }
    // the landing across the line with its ticket booth, and the main stair down to the street
    const span = 2 * (k.PLAT_IN + FLIGHT);
    box(along(L1), along(L1 + POD), span, [land - 0.3, land], [land - 0.3, land], col.step);
    box(along(L1 + POD / 2 - BOOTH / 2), along(L1 + POD / 2 + BOOTH / 2), BOOTH, [land, land + BOOTH], [land, land + BOOTH], col.wall);
    const m = Math.round(LANDING / RISE);
    for (let q = 0; q < m; q++) box(along(L1 + POD + q * TREAD), along(L1 + POD + (q + 1) * TREAD), MAIN, [g, land - (q + 1) * RISE], [g, land - (q + 1) * RISE], col.step);
    const compass = ["east", "north-east", "north", "north-west", "west", "south-west", "south", "south-east"][((Math.round(Math.atan2(uy, ux) / (Math.PI / 4)) % 8) + 8) % 8];
    report.push(`${name}: stairs at its ${compass} end (${n} steps a flight, ${(L1 + POD + m * TREAD).toFixed(1)} m beyond the platform)`);
  }
  return report;
}

// the line's direction at sample e, pointing o (1 up the samples, -1 down)
function dir(pts: V[], e: number, o: number) {
  const a = pts[Math.max(0, Math.min(pts.length - 1, e - o))], b = pts[Math.max(0, Math.min(pts.length - 1, e + o))], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
}
function inside([x, y]: V, ring: V[]) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function nearest(p: V, ring: V[]) {
  let best = ring[0], bd = Infinity;
  for (let i = 0; i + 1 < ring.length; i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L2)), q = [ax + dx * u, ay + dy * u], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) (bd = d), (best = q);
  }
  return best;
}
