// Puts a street's houses from the Adreßbuch (parse.ts) on the 1917 map. Between two corners the directory lists the
// houses in order. Where "Berlin um 1900" prints a house's number on its lot (map/1917/labels.geojson, house_number),
// the house is put there. Between such anchors, and where the 1900 map has no numbers, each house gets a share of the
// fronts as long as the share of house numbers it holds (assumed: Berlin lots on one street are of similar width; the
// directory gives no frontages). Each run reports how far that share rule alone would have put its anchored houses,
// which measures the assumption where it is all there is. A split moves to a lot edge of the 1900 footprints (a change
// of building along the front) within 6 m when there is one.
// Corners are matched to openings in the fronts (frontage.ts) near their positions in the street's config
// (streets/NAME.json: its axis, which may bend at its s0 end (frontage.ts), the corners' stations along it and where they come from, and its two sides' names, the
// first being the side the directory lists first, on the right of the axis as numbers rise).
//   bun place.ts STREET.json OUT.geojson streets/NAME.json
import { axis, at, buildings, fronts, localLine, median, openings, project, type Hit } from "./frontage.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)), map = join(here, "../../map");
const [src, out, cfgPath] = process.argv.slice(2);
const street = await Bun.file(src).json();
const cfg = await Bun.file(cfgPath).json();
const AX = axis(cfg.axis.a, cfg.axis.u, cfg.axis.s0, cfg.axis.s1, cfg.axis.bend);
const CORNERS: Record<string, number> = cfg.corners;
// The reader spells a corner with or without its dots ("Behrenstr", "Unt. d Linden"): matched on letters alone.
const norm = (t: string) => t.toLowerCase().replace(/[.\s]/g, "");
const CORNERS_N = new Map(Object.entries(CORNERS).map(([k, v]) => [norm(k), v]));
const SIDES: [string, string] = cfg.sides;
// How far from the axis a front is looked for: 30 m, or the config's `reach` for a wider street (the Linden is 60 m).
const REACH = cfg.reach ?? 30, SLACK = 4;

const bs = await buildings(map, AX, REACH);
// The 1900 map's house numbers within 30 m of the axis, by side: number -> station.
const numbers1900: Record<string, Map<number, number>> = { [SIDES[0]]: new Map(), [SIDES[1]]: new Map() };
for (const l of (await Bun.file(join(map, "1917/labels.geojson")).json()).features) {
  if (l.properties.kind !== "house_number" || !/^\d+$/.test(l.properties.text)) continue;
  const [s, d] = project(AX, l.geometry.coordinates);
  if (Math.abs(d) < REACH && s > AX.s0 && s < AX.s1) numbers1900[d > 0 ? SIDES[1] : SIDES[0]].set(Number(l.properties.text), s);
}
// Houses a source places outright where the 1900 map prints no number (the config's `known`: a number, a point on its
// front, the source), anchored the same way. For a building put up after 1900, such as the Admiralspalast (1910-11).
const knownSrc = new Map<number, string>();
for (const k of (cfg.known ?? []) as { number: number; at: [number, number]; source: string }[]) {
  knownSrc.set(k.number, k.source);
  const [s, d] = project(AX, k.at);
  if (Math.abs(d) < REACH && s > AX.s0 && s < AX.s1) numbers1900[d > 0 ? SIDES[1] : SIDES[0]].set(k.number, s);
}
/** s at position c along piecewise-linear knots [c, s] (c ascending). */
const lerp = (k: number[][], c: number) => {
  for (let i = 0; i + 1 < k.length; i++) if (c <= k[i + 1][0]) return k[i][1] + ((c - k[i][0]) / (k[i + 1][0] - k[i][0] || 1)) * (k[i + 1][1] - k[i][1]);
  return k[k.length - 1][1];
};
let anchored = 0, errSum = 0, errMax = 0;
const features: unknown[] = [];
const summary: string[] = [];
// The first side in the directory is on the right of the axis (sign -1) and walked as s rises; the second comes back.
for (const [i, side] of street.sides.entries()) {
  const name = SIDES[i], sign = i === 0 ? -1 : 1;
  const hits = fronts(AX, bs, sign as 1 | -1, REACH);
  const line = localLine(hits);
  const opens = openings(hits, name, line, SLACK, 6);
  const fronted = (h: Hit) => h.d !== null && h.d <= line(h.s) + SLACK;
  // Each corner: the opening containing or nearest its position, within 35 m, else a 12 m gap at the position.
  const corner = (m: string) => {
    const p = CORNERS[m] ?? CORNERS_N.get(norm(m));
    if (p === undefined) throw new Error(`no position for corner ${m}`);
    const dist = (o: { s0: number; s1: number }) => (p < o.s0 ? o.s0 - p : p > o.s1 ? p - o.s1 : 0);
    const best = opens.reduce((b, o) => (dist(o) < dist(b) ? o : b), opens[0]);
    return best && dist(best) <= 35 ? { s0: best.s0, s1: best.s1, snapped: true } : { s0: p - 6, s1: p + 6, snapped: false };
  };
  const houses = side.houses as { numbers: number[]; printed: string; after: string; entries: { text: string; role: string | null; kind: string; phone: boolean }[]; flags: string[]; note: string | null }[];
  // Runs of houses between two corners, in the order listed.
  const markers: string[] = side.markers;
  for (let k = 0; k < markers.length; k++) {
    const run = houses.filter((h) => h.after === markers[k]);
    if (!run.length) continue;
    const a = corner(markers[k]), b = corner(markers[k + 1] ?? markers[k]);
    // The stations between the two corners with a building in reach, in walking order (s rising on the first side, falling
    // on the second). A front set back behind the building line (a forecourt, a palace's cour d'honneur) belongs to its
    // lot and is kept, or a house anchored on a printed number there shrinks to a metre and squeezes its neighbours;
    // stations with no building in reach (a bridge, an open square) are left out.
    const [from, to] = a.s0 < b.s0 ? [a.s1, b.s0] : [b.s1, a.s0];
    let st: Hit[] = hits.filter((h) => h.s > from && h.s < to && (fronted(h) || h.id !== null));
    // A run that reaches past the axis (the slice's edge) keeps its full length as unknown front, so its houses spread
    // over the whole run and those that fall beyond the edge are left out, not squeezed into the part we have.
    for (let s = Math.max(from, AX.s1) + 1; s < to; s++) st.push({ s, d: null, id: null });
    for (let s = from + 1; s < Math.min(to, AX.s0); s++) st.push({ s, d: null, id: null });
    st.sort((p, q) => p.s - q.s);
    if (sign === 1) st = st.reverse();
    if (!st.some((h) => h.id !== null)) { summary.push(`${name}: no fronts between ${markers[k]} and ${markers[k + 1]} for ${run.length} houses`); continue; }
    let beyond = 0;
    const weight = run.map((h) => h.numbers.length), total = weight.reduce((x, y) => x + y, 0);
    const start = run.map((_, j) => weight.slice(0, j).reduce((x, y) => x + y, 0));
    // Knots of station against position in the run (in house numbers): the run's two ends, and each house whose number
    // the 1900 map prints within the run, kept only while they go on in walking order.
    const sFrom = sign === 1 ? to : from, sTo = sign === 1 ? from : to, dir = Math.sign(sTo - sFrom);
    const share = (c: number) => sFrom + (c / total) * (sTo - sFrom);
    const knots = [[0, sFrom]];
    const anchorOf: (number | null)[] = run.map(() => null);
    for (const [j, h] of run.entries()) {
      const hit = h.numbers.map((n) => numbers1900[name].get(n)).find((v) => v !== undefined);
      if (hit === undefined || (hit - sFrom) * dir <= 0 || (sTo - hit) * dir <= 0 || (hit - knots[knots.length - 1][1]) * dir <= 0) continue;
      const c = start[j] + weight[j] / 2;
      knots.push([c, hit]);
      anchorOf[j] = hit;
      const e = Math.abs(share(c) - hit);
      anchored++; errSum += e; errMax = Math.max(errMax, e);
    }
    knots.push([total, sTo]);
    // Split indices along st (in walking order), each moved to a change of building within 6 stations.
    const idx = (sv: number) => { const i = st.findIndex((h) => (h.s - sv) * dir >= 0); return i < 0 ? st.length : i; };
    const cuts = [0];
    for (let j = 0; j + 1 < run.length; j++) {
      let c = Math.max(cuts[cuts.length - 1] + 1, idx(lerp(knots, start[j] + weight[j])));
      let best = c;
      for (let d = 1; d <= 6; d++) {
        for (const e of [c - d, c + d]) if (e > cuts[cuts.length - 1] && e < st.length && st[e].id !== st[e - 1].id && best === c) best = e;
        if (best !== c) break;
      }
      cuts.push(Math.max(cuts[cuts.length - 1] + 1, Math.min(st.length - 1, best)));
    }
    cuts.push(st.length);
    for (const [j, h] of run.entries()) {
      const seg = st.slice(cuts[j], cuts[j + 1]).filter((q) => q.id !== null);
      if (!seg.length) { beyond++; continue; }
      const mid = seg[seg.length >> 1] as Extract<Hit, { d: number }>;
      const face = (s: Hit) => at(AX, s.s, sign * (s.d ?? line(s.s)));
      // A corrected house is labelled with the number it was taken as (with its letter), not the misreading.
      const taken = h.flags.map((f) => f.match(/taken as (\d+[a-e]?)/)?.[1]).filter(Boolean).at(-1);
      const label = taken ? (h.numbers.length > 1 ? `${h.numbers[0]}–${h.numbers[h.numbers.length - 1]}` : taken) : h.printed;
      const store = h.entries.filter((e) => e.role !== "owner" && e.role !== "manager" && ["shop", "food", "bank", "hotel"].includes(e.kind));
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: face(mid).map((v) => Math.round(v * 100) / 100) },
        properties: {
          street: street.street.replace(/Str$/, "Straße"), side: name, house: label, printed: h.printed, numbers: h.numbers, between: [markers[k], markers[k + 1] ?? null],
          placed: anchorOf[j] !== null ? (h.numbers.map((n) => knownSrc.get(n)).find(Boolean) ?? "on its number in Berlin um 1900") : "by share of house numbers between anchors or corners (assumed)",
          building_id: mid.id, building_key: bs.find((b) => b.id === mid.id)?.props.key ?? null, frontage_m: seg.length, front: [face(seg[0]), face(seg[seg.length - 1])].map((p) => p.map((v) => Math.round(v * 10) / 10)),
          corners: a.snapped && b.snapped ? "both corners on openings in the 1917 fronts" : "a corner placed at its listed position (no opening found)",
          note: h.note, flags: h.flags, owner: h.entries.find((e) => e.role === "owner")?.text ?? null,
          storefronts: store.map((e) => ({ text: e.text, kind: e.kind })), entries: h.entries,
        },
      });
    }
    summary.push(`${name} ${markers[k]} -> ${markers[k + 1] ?? "end"}: ${run.length - beyond} houses on ${st.filter((q) => q.id !== null).length} m of front, ${anchorOf.filter((a) => a !== null).length} anchored on printed numbers${beyond ? `; ${beyond} beyond the slice` : ""}`);
  }
}
await Bun.write(out, JSON.stringify({ type: "FeatureCollection", name: "businesses_1917", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: street.source, placement: "houses on their numbers in Berlin um 1900 where it prints them; elsewhere spread along the 1917 fronts between anchors or the corners the Adreßbuch lists, by share of house numbers; splits snapped to 1900 lot edges within 6 m", features }));
console.log(summary.join("\n"));
if (anchored) console.log(`${anchored} houses anchored (on Berlin um 1900's numbers or a known source); the share rule alone would have put them ${(errSum / anchored).toFixed(1)} m off on average, ${errMax.toFixed(1)} m at most`);
console.log(`${features.length} houses placed, ${features.reduce((n: number, f: any) => n + f.properties.storefronts.length, 0)} storefront entries -> ${out}`);
