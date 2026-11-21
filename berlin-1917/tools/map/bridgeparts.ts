// The parts of the bridges research/bridge-parts-1917.tsv measures (piers, abutments, openings, bays, statues), laid out
// on each bridge's axis in EPSG:25833, for the world lane to build faces, parapets and pedestals on.
// A part is a box in the bridge's frame (s along the axis, t across it); its faces across the axis may bow on circular
// arcs (the Kaiser-Wilhelm-Brücke's D-shaped piers and concave abutments); "round" ends close a part with half circles. The table says what is measured and what
// is assumed, and every feature carries its row's note and source.
//   bun bridgeparts.ts [SLICE.json]   in: research/bridge-parts-1917.tsv   out: map/1917/bridge_parts.geojson
import { slicePaths } from "./paths";

const slicePath = process.argv.slice(2).find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { map, root } = await slicePaths(slicePath);
const STEP = 0.5; // m between points on a bowed face
const rows = (await Bun.file(`${root}/research/bridge-parts-1917.tsv`).text()).split("\n").filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("bridge\t"))
  .map((l) => { const c = l.split("\t"); return { bridge: c[0], part: c[1], s0: c[2], s1: c[3], t0: c[4], t1: c[5], bow0: c[6], bow1: c[7], heading: c[8], note: c[9], from: c[10], ends: c[11] }; });
const num = (v: string | undefined) => (v === undefined || v.trim() === "" ? null : Number(v));
const frames = new Map<string, { c: number[]; u: number[]; n: number[] }>();
for (const r of rows.filter((r) => r.part === "frame")) {
  const [x, y, ux, uy] = [r.s0, r.s1, r.t0, r.t1].map(Number), L = Math.hypot(ux, uy);
  frames.set(r.bridge, { c: [x, y], u: [ux / L, uy / L], n: [-uy / L, ux / L] });
}
// The offset of a bowed face from its chord at t, for a face from ta to tb whose middle stands bow m off the chord.
const arc = (t: number, ta: number, tb: number, bow: number) => {
  if (!bow) return 0;
  const c = (tb - ta) / 2, m = (ta + tb) / 2, h = Math.abs(bow), R = (c * c + h * h) / (2 * h);
  return Math.sign(bow) * (Math.sqrt(Math.max(0, R * R - (t - m) ** 2)) - (R - h));
};
const out: any[] = [];
for (const r of rows.filter((r) => r.part !== "frame")) {
  const f = frames.get(r.bridge);
  if (!f) throw new Error(`no frame row for ${r.bridge}`);
  const P = (s: number, t: number) => [+(f.c[0] + f.u[0] * s + f.n[0] * t).toFixed(2), +(f.c[1] + f.u[1] * s + f.n[1] * t).toFixed(2)];
  const s0 = num(r.s0)!, s1 = num(r.s1) ?? s0, t0 = num(r.t0) ?? 0, t1 = num(r.t1), b0 = num(r.bow0) ?? 0, b1 = num(r.bow1) ?? 0, hd = num(r.heading);
  let geometry: any, extra: any = {};
  if (hd !== null) {
    geometry = { type: "Point", coordinates: P(s0, t0) };
    const bearing = ((Math.atan2(f.n[0], f.n[1]) * 180) / Math.PI + hd + 360) % 360;
    extra = { heading_deg: +bearing.toFixed(1) };
  } else if (/opening$/.test(r.part)) {
    geometry = { type: "LineString", coordinates: [P(s0, 0), P(s1, 0)] };
    extra = { clear_span_m: +(s1 - s0).toFixed(2) };
  } else if (t1 !== null && s0 === s1 && !b0 && !b1) {
    geometry = { type: "LineString", coordinates: [P(s0, t0), P(s0, t1)] };
  } else {
    const n = Math.max(2, Math.ceil((t1! - t0) / STEP)), ts = Array.from({ length: n + 1 }, (_, i) => t0 + ((t1! - t0) * i) / n);
    // A round end: a half circle across the part's width at t = te, bulging away from the part (dir +1 or -1).
    const cap = (te: number, dir: number, from: number, to: number) => Array.from({ length: 11 }, (_, i) => {
      const a = from + ((to - from) * (i + 1)) / 12, r = (s1 - s0) / 2;
      return P((s0 + s1) / 2 + r * Math.cos(a), te + dir * r * Math.sin(Math.abs(a)));
    });
    const round = r.ends?.trim() === "round";
    const ring = [...ts.map((t) => P(s0 - arc(t, t0, t1!, b0), t)), ...(round ? cap(t1!, 1, Math.PI, 0) : []),
      ...ts.reverse().map((t) => P(s1 + arc(t, t0, t1!, b1), t)), ...(round ? cap(t0, -1, 0, -Math.PI) : [])];
    geometry = { type: "Polygon", coordinates: [[...ring, ring[0]]] };
    extra = { s: [s0 - b0, s1 + b1].map((v) => +v.toFixed(2)), t: round ? [+(t0 - (s1 - s0) / 2).toFixed(2), +(t1! + (s1 - s0) / 2).toFixed(2)] : [t0, t1] };
  }
  out.push({ type: "Feature", geometry, properties: { kind: "bridge part", bridge: r.bridge, part: r.part, ...extra, note: r.note, from: r.from } });
}
await Bun.write(`${map}/bridge_parts.geojson`, JSON.stringify({ type: "FeatureCollection", name: "bridge_parts_1917", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: "research/bridge-parts-1917.tsv (tools/map/bridgeparts.ts): s along each bridge's axis, t across it, from the frame row", features: out }));
console.log(`bridgeparts: ${out.length} parts on ${frames.size} bridges (${[...frames.keys()].join(", ")})`);
