// Geometry the outdoor kits share (kit/tram.ts, vehicles.ts, military.ts, lamps.ts, roof.ts, patriot.ts): wheels,
// a coachbuilder's arched roof, lettering, nail fields. Every vehicle's frame: origin on the ground (a tram's: the
// rail's top) under the middle between its axles, +z forward, y up, x to its right-hand side seen from behind... the
// x axis is the vehicle's width, +x on the right of a coachman facing +z.
import { crossSection, manifold, type Solid } from "raea/3d";
import { box, lathe, noise3, union, type V3 } from "./geo";
import { bar } from "./porter";

/** A wheel with its axis along x, centred at the origin: an iron tyre, a wooden felloe, n spokes and a barrel hub
 *  (cart, cab and army wheels). Returns the iron and the wood apart, for their materials. R: to the tyre's tread. */
export function spoked(R: number, w: number, n: number, o: { tyre?: number; felloe?: number; hub?: number; spoke?: number; dish?: number } = {}) {
  const ty = o.tyre ?? 0.018, fe = o.felloe ?? 0.06, hr = o.hub ?? Math.max(0.07, R * 0.17), sr = o.spoke ?? Math.max(0.014, R * 0.03), dish = o.dish ?? 0;
  const ax = (s: Solid) => s.rotate(0, 0, 90);
  const tyre = ax(lathe([[R - ty, -w / 2], [R, -w / 2], [R, w / 2], [R - ty, w / 2]]));
  const fel = ax(lathe([[R - ty - fe, -w * 0.42], [R - ty + 0.002, -w * 0.42], [R - ty + 0.002, w * 0.42], [R - ty - fe, w * 0.42]]));
  const hl = Math.max(w * 1.3, hr * 1.6);
  const hub = ax(lathe([[0, -hl / 2], [hr * 0.62, -hl / 2], [hr * 0.9, -hl * 0.3], [hr, 0], [hr * 0.9, hl * 0.3], [hr * 0.55, hl / 2], [0, hl / 2]]));
  const sp: Solid[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    sp.push(bar([dish, hr * 0.85 * c, hr * 0.85 * s], [0, (R - ty - fe * 0.5) * c, (R - ty - fe * 0.5) * s], sr));
  }
  return { iron: tyre, wood: union(fel, hub, ...sp) };
}

/** A pressed or cast wheel with its axis along x: a disc with a rim and a boss (a lorry's cast-steel wheel under its
 *  solid tyre, a tram's wheel with its flange). `tyre`: a solid rubber band round it, t thick. */
export function disc(R: number, w: number, o: { flange?: number; tyre?: number; boss?: number; spokes?: number } = {}) {
  const ax = (s: Solid) => s.rotate(0, 0, 90);
  const t = o.tyre ?? 0, r0 = R - t, fl = o.flange ?? 0;
  const rim = ax(lathe([[r0 - 0.05, -w / 2], [r0, -w / 2], [r0, w / 2], ...(fl ? [[r0 + fl, w / 2], [r0 + fl, w / 2 - 0.02]] as [number, number][] : []), [r0 - 0.05, w / 2 - 0.02]]));
  const web = ax(lathe([[0, -0.03], [r0 - 0.04, -0.015], [r0 - 0.04, 0.015], [0, 0.03]]));
  const boss = ax(lathe([[0, -w * 0.7], [o.boss ?? R * 0.2, -w * 0.7], [o.boss ?? R * 0.2, w * 0.7], [0, w * 0.7]]));
  let steel = union(rim, web, boss);
  // a cast wheel's spokes stand proud of its web as ribs
  if (o.spokes) {
    const ribs: Solid[] = [];
    for (let i = 0; i < o.spokes; i++) { const a = (i / o.spokes) * Math.PI * 2; ribs.push(bar([0, R * 0.2 * Math.cos(a), R * 0.2 * Math.sin(a)], [0, (r0 - 0.05) * Math.cos(a), (r0 - 0.05) * Math.sin(a)], 0.028)); }
    steel = union(steel, ...ribs);
  }
  const rubber = t ? ax(lathe([[r0 - 0.005, -w / 2 + 0.005], [R - 0.01, -w / 2 + 0.005], [R, -w / 2 + 0.02], [R, w / 2 - 0.02], [R - 0.01, w / 2 - 0.005], [r0 - 0.005, w / 2 - 0.005]])) : null;
  return { steel, rubber };
}

/** An arched roof across x (half-width hw), rising `rise` from the eaves at y0 to its crown, t thick, `len` along z,
 *  centred on z. */
export function archRoof(hw: number, y0: number, rise: number, t: number, len: number, n = 14): Solid {
  const top: [number, number][] = [], bot: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const x = -hw + (2 * hw * i) / n, f = 1 - (x / hw) ** 2; top.push([x, y0 + rise * f]); bot.push([x, y0 + rise * f - t]); }
  return crossSection.polygon([...bot, ...top.reverse()]).extrude(len).move(0, 0, -len / 2);
}

/** A plan outline (x, z) stood up into a prism from y0 to y1: what an arched roof is cut to, for rounded ends. */
export function prism(plan: [number, number][], y0: number, y1: number): Solid {
  let pts = plan.map(([x, z]): [number, number] => [x, -z]);
  let A = 0;
  for (let i = 0; i < pts.length; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % pts.length]; A += a * d - c * b; }
  if (A < 0) pts = pts.reverse();
  return crossSection.polygon(pts).extrude(y1 - y0).rotate(-90, 0, 0).move(0, y0, 0);
}

/** A plan outline: a w by l rectangle along z whose two ends are arcs bulging out by `bulge` (a tram's platform). */
export function roundEnds(w: number, l: number, bulge: number, n = 10): [number, number][] {
  const out: [number, number][] = [], h = w / 2, e = l / 2 - bulge;
  for (let i = 0; i <= n; i++) { const x = h - (2 * h * i) / n; out.push([x, e + bulge * (1 - (x / h) ** 2)]); }
  for (let i = 0; i <= n; i++) { const x = -h + (2 * h * i) / n; out.push([x, -e - bulge * (1 - (x / h) ** 2)]); }
  return out;
}

/** Points along an arc in plan, for a curved panel built of flat facets (a dash, a fender). */
export function arcPts(h: number, e: number, bulge: number, n: number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => { const x = -h + (2 * h * i) / n; return [x, e + bulge * (1 - (x / h) ** 2)] as [number, number]; });
}
/** A panel standing on a plan polyline: each segment a box t thick from y0 to y1. */
export function wallAlong(pts: [number, number][], y0: number, y1: number, t: number): Solid {
  const s: Solid[] = [];
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], L = Math.hypot(x1 - x0, z1 - z0) + t * 0.6;
    s.push(box(L, y1 - y0, t, 0, 0, 0).rotate(0, (-Math.atan2(z1 - z0, x1 - x0) * 180) / Math.PI, 0).move((x0 + x1) / 2, y0, (z0 + z1) / 2));
  }
  return union(...s);
}

/** Capital letters for a sign, `size` high, `depth` proud, centred on x and y at the origin, facing +z (Inter, the
 *  sans the engine has: a 1917 sign painter's block letters, not a book face). */
const TEXT = new Map<string, Solid>();
export function sign(t: string, size: number, depth = 0.003, weight = 700): Solid {
  const k = `${t}|${size}|${depth}|${weight}`;
  let s = TEXT.get(k);
  if (!s) {
    const raw = manifold.text3d(t, size, depth, "Inter", weight), b = raw.bounds();
    const lo = b.min as unknown as number[], hi = b.max as unknown as number[];
    s = raw.move(-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]);
    TEXT.set(k, s);
  }
  return s;
}

/** Nail heads over a field: every point of a grid `step` apart inside `inside(x, y)`, each a low dome r across, on
 *  the plane z = 0 facing +z (a Wehrschild's, an Iron Cross's, the Iron Hindenburg's iron). */
export function nails(w: number, h: number, step: number, r: number, inside: (x: number, y: number) => boolean, jitter = 0.25, seed = 1): Solid | null {
  const heads: Solid[] = [];
  let k = seed;
  const rnd = () => { k = (k * 16807) % 2147483647; return k / 2147483647 - 0.5; };
  const head = lathe([[0, 0], [r, 0], [r * 0.8, r * 0.35], [0, r * 0.5]], 0, 0, 0, 6).rotate(90, 0, 0);
  for (let y = -h / 2; y <= h / 2; y += step) for (let x = -w / 2 + ((Math.round(y / step) & 1) * step) / 2; x <= w / 2; x += step) {
    const px = x + rnd() * step * jitter, py = y + rnd() * step * jitter;
    if (inside(px, py)) heads.push(head.move(px, py, 0));
  }
  return heads.length ? manifold.union(...heads) : null;
}

/** A thin iron rod between two points (a grab rail, a stay, a brace). */
export const rod = (a: V3, b: V3, r = 0.012) => bar(a, b, r);

/** A scanned model (tools/scan.sh, fitted by `raea gen check --h`: its real size, its origin at the bottom centre), or
 *  null when its file isn't there yet. The path is the project's. */
const SCANS = new Map<string, Solid | null>();
export function scanned(path: string): Solid | null {
  if (!SCANS.has(path)) { let s: Solid | null = null; try { s = manifold.import(path); } catch { s = null; } SCANS.set(path, s); }
  return SCANS.get(path)!;
}

/** Road mud thrown up from the setts: a mask w by l (centred, the vehicle's frame) whose ragged top runs between y0
 *  and y1 by noise over x and z, two octaves, so wheels and guards carry more than the panels between them. */
export function splashMask(w: number, l: number, y0: number, y1: number, seed: number): Solid {
  const top = y1 + 0.05;
  return box(w, top + 0.05, l, 0, -0.05, 0).refineToLength(0.05).warp((px, py, pz) => {
    if (py < top - 1e-4) return [px, py, pz];
    const n = 0.5 + 0.4 * noise3(px * 1.6, 0.5, pz * 1.6, seed) + 0.1 * noise3(px * 5, 1.5, pz * 5, seed + 1);
    return [px, y0 + (y1 - y0) * Math.min(1, Math.max(0, n)), pz];
  });
}
type MudPart = { mat: import("./mats").MatId; solid: Solid; overlap?: boolean };
/** Parts split by a splash mask: what lies under it (of the materials named, all by default) becomes `mud`, as its
 *  own part; the rest keeps its material. Glass, lamps and what glows stay clean. */
export function muddy(parts: MudPart[], mask: Solid, mud: import("./mats").MatId = "mud-road", only?: string[]): MudPart[] {
  const out: MudPart[] = [], under: Solid[] = [];
  for (const p of parts) {
    if ((only && !only.includes(p.mat)) || /glass|mantle|flame|sign|cloth/.test(p.mat)) { out.push(p); continue; }
    const m = p.solid.intersect(mask);
    if (m.isEmpty()) { out.push(p); continue; }
    under.push(m);
    out.push({ ...p, solid: p.solid.minus(mask) });
  }
  if (under.length) out.push({ mat: mud, solid: union(...under), overlap: true });
  return out;
}
