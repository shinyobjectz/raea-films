// The U-Bahn of 1917 on its real path. Between each pair of consecutive stations, the cheapest route over the Straube
// plan at 1 m, where the plan's own railway marks cost least: the dark blue dashes of the "Untergrundbahn" band and
// the purple-grey dashes of the Hochbahn viaduct (both: blue minus red at least 8, red under 150; water is paler, red
// 160 or more). Then street and yard, then water, park and rail, and buildings most (a line passes under a building
// only where the plan says so, e.g. the Kunstschule north of Klosterstraße).
//   stations  OpenHistoricalMap, dated to 1917 (CC0): cache/berlin/ohm_subway_stations.json
//   lines     the October 1913 network, unchanged until 1923 (berliner-untergrundbahn.de; Wikipedia "Geschichte der
//             Berliner U-Bahn"); kind per stretch (tunnel, viaduct, ramp, cutting) from the same histories
//   out       map/1917/city/ubahn.geojson: stretches (line, from, to, kind, path) and stations, EPSG:25833
// usage: bun tunnels.ts [CITY.json]
import { readRGB } from "./raster.ts";
import { slicePaths } from "./paths.ts";
import { $ } from "bun";
import { utm as utmSync } from "./utm";
const utm = async (lon: number, lat: number) => utmSync(lon, lat);

const { slice, cache, root } = await slicePaths(process.argv[2] ?? `${import.meta.dir}/berlin.json`);
const [X0, Y0, X1, Y1] = slice.bbox as number[];
const TILE = 500, PX = 2000, SUB = PX / TILE; // 4 plan pixels to a metre

type Kind = "tunnel" | "viaduct" | "ramp" | "cutting";
// Each line as its stops, each with the kind of the stretch that leaves it. A ramp climbs (or falls) from the kind of
// the stretch before it to the kind of the one after: Wittenbergplatz to the Nollendorfplatz Hochbahnhof (Deutsche
// Bauzeitung 1901, Abb. 4), Gleisdreieck down to Leipziger Platz, Senefelderplatz up to the Schönhauser Allee viaduct.
const LINES: { line: string; opened: string; stops: [string, Kind][] }[] = [
  {
    line: "Centrumslinie and Nordring (Zuggruppe I)", opened: "1902-1913",
    stops: [["Wilhelmplatz", "tunnel"], ["Bismarckstraße", "tunnel"], ["Knie", "tunnel"], ["Zoologischer Garten", "tunnel"],
      ["Wittenbergplatz", "ramp"], ["Nollendorfplatz", "viaduct"], ["Bülowstraße", "viaduct"], ["Gleisdreieck", "ramp"],
      ["Leipziger Platz", "tunnel"], ["Kaiserhof", "tunnel"], ["Friedrichstraße", "tunnel"], ["Hausvogteiplatz", "tunnel"],
      ["Spittelmarkt", "tunnel"], ["Inselbrücke", "tunnel"], ["Klosterstraße", "tunnel"], ["Alexanderplatz", "tunnel"],
      ["Schönhauser Tor", "tunnel"], ["Senefelderplatz", "ramp"], ["Danziger Straße", "viaduct"], ["Nordring", "viaduct"]],
  },
  {
    line: "Östliche Stammstrecke (Zuggruppe III)", opened: "1902",
    stops: [["Warschauer Brücke", "viaduct"], ["Stralauer Tor", "viaduct"], ["Schlesisches Tor", "viaduct"], ["Oranienstraße", "viaduct"],
      ["Kottbusser Tor", "viaduct"], ["Prinzenstraße", "viaduct"], ["Hallesches Tor", "viaduct"], ["Möckernbrücke", "viaduct"], ["Gleisdreieck", "viaduct"]],
  },
  { line: "Westendstrecke", opened: "1908-1913", stops: [["Bismarckstraße", "tunnel"], ["Sophie-Charlotte-Platz", "tunnel"], ["Kaiserdamm", "tunnel"], ["Reichskanzlerplatz", "tunnel"], ["Stadion", "tunnel"]] },
  { line: "Schöneberger Untergrundbahn", opened: "1910", stops: [["Nollendorfplatz", "tunnel"], ["Viktoria-Luise-Platz", "tunnel"], ["Bayerischer Platz", "tunnel"], ["Stadtpark", "tunnel"], ["Hauptstraße", "tunnel"]] },
  {
    line: "Wilmersdorf-Dahlemer Bahn", opened: "1913",
    stops: [["Wittenbergplatz", "tunnel"], ["Hohenzollernplatz", "tunnel"], ["Fehrbelliner Platz", "tunnel"], ["Heidelberger Platz", "tunnel"],
      ["Rüdesheimer Platz", "tunnel"], ["Breitenbachplatz", "cutting"], ["Podbielskiallee", "cutting"], ["Dahlem-Dorf", "cutting"], ["Thielplatz", "cutting"]],
  },
  { line: "Kurfürstendamm-Linie", opened: "1913", stops: [["Wittenbergplatz", "tunnel"], ["Kurfürstendamm", "tunnel"], ["Uhlandstraße", "tunnel"]] },
];

// Stations in service in 1917.
type Station = { name: string; opened: string; closed: string; x: number; y: number };
const raw = await Bun.file(`${cache}/ohm_subway_stations.json`).json();
const stations = new Map<string, Station>();
for (const e of raw.elements) {
  const s = (e.tags.start_date ?? "0000").slice(0, 4), t = (e.tags.end_date ?? "9999").slice(0, 4);
  if (s > "1917" || t <= "1917" || !e.tags.name) continue;
  const [x, y] = await utm(e.lon, e.lat);
  stations.set(e.tags.name, { name: e.tags.name, opened: e.tags.start_date ?? "", closed: e.tags.end_date ?? "", x, y });
}

// The cost of each metre of a tile, from the plan and the reader's gated classes (0 yard, 1 street, 2 building,
// 3 public, 4 water, 5 green, 6 rail). 255: off the plan.
const COST = { mark: 1, street: 4, yard: 4, water: 10, green: 10, rail: 8, building: 60, blank: 5 };
// Blank paper (no sheet of the plan there: every channel over 240) costs like street but is counted, and a stretch
// more than a fifth over blank paper is drawn straight instead (path "straight (off the plan)").
const BLANK = 254;
const tiles = new Map<string, Uint8Array>();
async function tile(tx: number, ty: number): Promise<Uint8Array | null> {
  const id = `${tx / 100}_${ty / 100}`;
  if (tiles.has(id)) return tiles.get(id)!;
  const plan = `${cache}/rasters/straube/${id}.png`, pred = `${cache}/pred/${id}.png`;
  if (!(await Bun.file(plan).exists()) || !(await Bun.file(pred).exists())) return tiles.set(id, null as never), null;
  const t0 = performance.now();
  const { px } = await readRGB(plan, PX, PX);
  if (process.env.DEBUG) console.error(`tile ${id} read in ${(performance.now() - t0).toFixed(0)} ms`);
  const lab = new Uint8Array(await $`magick ${pred} -depth 8 gray:-`.arrayBuffer());
  const c = new Uint8Array(TILE * TILE), votes = new Int32Array(7), table = [COST.yard, COST.street, COST.building, COST.building, COST.water, COST.green, COST.rail];
  for (let j = 0; j < TILE; j++)
    for (let i = 0; i < TILE; i++) {
      let marks = 0, blanks = 0;
      votes.fill(0);
      for (let v = 0; v < SUB; v++)
        for (let u = 0; u < SUB; u++) {
          const k = (j * SUB + v) * PX + i * SUB + u, r = px[k * 3], b = px[k * 3 + 2];
          if (b - r >= 8 && r < 150) marks++;
          if (r > 240 && px[k * 3 + 1] > 240 && b > 240) blanks++;
          votes[lab[k]]++;
        }
      let cls = 0;
      for (let k = 1; k < 7; k++) if (votes[k] > votes[cls]) cls = k;
      c[j * TILE + i] = blanks >= 12 ? BLANK : marks >= 3 ? COST.mark : table[cls];
    }
  tiles.set(id, c);
  return c;
}

/** Cheapest 8-connected route from a to b inside the box around them (margin m), as EPSG:25833 points. */
async function route(a: Station, b: Station, m: number): Promise<number[][] | null> {
  const bx0 = Math.max(X0, Math.floor(Math.min(a.x, b.x) - m)), by0 = Math.max(Y0, Math.floor(Math.min(a.y, b.y) - m));
  const bx1 = Math.min(X1, Math.ceil(Math.max(a.x, b.x) + m)), by1 = Math.min(Y1, Math.ceil(Math.max(a.y, b.y) + m));
  const W = bx1 - bx0, H = by1 - by0;
  const cost = new Uint8Array(W * H).fill(255);
  for (let ty = Math.floor((by0 - Y0) / TILE) * TILE + Y0; ty < by1; ty += TILE)
    for (let tx = Math.floor((bx0 - X0) / TILE) * TILE + X0; tx < bx1; tx += TILE) {
      const c = await tile(tx, ty);
      if (!c) continue;
      for (let y = Math.max(ty, by0); y < Math.min(ty + TILE, by1); y++)
        for (let x = Math.max(tx, bx0); x < Math.min(tx + TILE, bx1); x++)
          cost[(by1 - 1 - y) * W + (x - bx0)] = c[(ty + TILE - 1 - y) * TILE + (x - tx)];
    }
  const at = (x: number, y: number) => (by1 - 1 - Math.floor(y)) * W + (Math.floor(x) - bx0);
  const s = at(a.x, a.y), t = at(b.x, b.y);
  if (s < 0 || s >= W * H || t < 0 || t >= W * H) return null;
  // Float64 distances: with float32 a re-relaxed node can compare below its own rounded distance and be expanded again
  // and again. The heap is typed arrays with plain swaps (destructuring swaps allocate on every step).
  const dist = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
  let cap = 1 << 16, size = 0, heap = new Int32Array(cap), key = new Float64Array(cap);
  const push = (n: number, d: number) => {
    if (size === cap) {
      cap *= 2;
      const h = new Int32Array(cap), k = new Float64Array(cap);
      h.set(heap), k.set(key), (heap = h), (key = k);
    }
    let i = size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (key[p] <= d) break;
      heap[i] = heap[p], (key[i] = key[p]), (i = p);
    }
    heap[i] = n, (key[i] = d);
  };
  let popped = 0, poppedKey = 0;
  const pop = () => {
    popped = heap[0], (poppedKey = key[0]);
    const ln = heap[--size], ld = key[size];
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = -1, mk = ld;
      if (l < size && key[l] < mk) (m = l), (mk = key[l]);
      if (r < size && key[r] < mk) m = r;
      if (m < 0) break;
      heap[i] = heap[m], (key[i] = key[m]), (i = m);
    }
    heap[i] = ln, (key[i] = ld);
  };
  dist[s] = 0, push(s, 0);
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], LEN = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];
  while (size) {
    pop();
    const n = popped, d = poppedKey;
    if (n === t) break;
    if (d > dist[n]) continue;
    const x = n % W, y = (n / W) | 0;
    for (let q = 0; q < 8; q++) {
      const nx = x + DX[q], ny = y + DY[q];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const k = ny * W + nx, c = cost[k];
      if (c === 255) continue;
      const nd = d + LEN[q] * (c === BLANK ? COST.blank : c);
      if (nd < dist[k]) (dist[k] = nd), (prev[k] = n), push(k, nd);
    }
  }
  if (prev[t] < 0) return null;
  const pts: number[][] = [];
  let onBlank = 0;
  for (let n = t; n >= 0; n = prev[n]) pts.push([bx0 + (n % W) + 0.5, by1 - ((n / W) | 0) - 0.5]), cost[n] === BLANK && onBlank++;
  if (onBlank > 0.2 * pts.length) return null;
  pts.reverse();
  pts[0] = [a.x, a.y], (pts[pts.length - 1] = [b.x, b.y]);
  // The route wobbles between the plan's dashes (each about 3 m wide); a 4 m simplification and three rounds of
  // Chaikin's corner cutting (the stations held) give the smooth curves of a railway.
  return chaikin(simplify(pts, 4), 3);
}

function chaikin(p: number[][], rounds: number): number[][] {
  for (let r = 0; r < rounds && p.length > 2; r++) {
    const q = [p[0]];
    for (let i = 0; i + 1 < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      if (i > 0) q.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by]);
      if (i + 2 < p.length) q.push([0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

function simplify(p: number[][], tol: number): number[][] {
  if (p.length < 3) return p;
  const [a, b] = [p[0], p[p.length - 1]];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  let worst = 0, at = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = Math.abs(dy * (p[i][0] - a[0]) - dx * (p[i][1] - a[1])) / L;
    if (d > worst) (worst = d), (at = i);
  }
  return worst <= tol ? [a, b] : [...simplify(p.slice(0, at + 1), tol).slice(0, -1), ...simplify(p.slice(at), tol)];
}

const inside = (s: Station) => s.x > X0 && s.x < X1 && s.y > Y0 && s.y < Y1;
const features: object[] = [];
const report: string[] = [];
const used = new Set<string>();
for (const L of LINES) {
  const stops = L.stops.filter(([n]) => (stations.has(n) ? true : (report.push(`${L.line}: no 1917 station "${n}" in OHM, routed through`), false)));
  for (let i = 0; i + 1 < stops.length; i++) {
    const a = stations.get(stops[i][0])!, b = stations.get(stops[i + 1][0])!;
    if (!inside(a) && !inside(b)) continue;
    const kind = stops[i][1];
    const ends = kind === "ramp" ? { from_level: stops[i - 1]?.[1] ?? "tunnel", to_level: stops[i + 1]?.[1] ?? "tunnel" } : {};
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    let pts = inside(a) && inside(b) ? await route(a, b, Math.max(150, d * 0.35)) : null;
    const path = pts ? "plan-traced" : "straight (off the plan)";
    pts ??= [[a.x, a.y], [b.x, b.y]];
    const len = pts.slice(1).reduce((s, p, k) => s + Math.hypot(p[0] - pts![k][0], p[1] - pts![k][1]), 0);
    used.add(a.name), used.add(b.name);
    console.error(`${L.line}: ${a.name} - ${b.name} ${kind}, ${path}, ${len.toFixed(0)} m (straight ${d.toFixed(0)} m)`);
    features.push({ type: "Feature", properties: { feature: "stretch", line: L.line, opened: L.opened, from: a.name, to: b.name, kind, ...ends, path, length_m: Math.round(len) }, geometry: { type: "LineString", coordinates: pts.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]) } });
  }
}
for (const n of used) {
  const s = stations.get(n)!;
  features.push({ type: "Feature", properties: { feature: "station", name: s.name, opened: s.opened, closed: s.closed, source: "OpenHistoricalMap (CC0)" }, geometry: { type: "Point", coordinates: [+s.x.toFixed(2), +s.y.toFixed(2)] } });
}
await $`mkdir -p ${root}/map/1917/city`;
await Bun.write(`${root}/map/1917/city/ubahn.geojson`, JSON.stringify({ type: "FeatureCollection", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } }, features }));
console.log(report.join("\n"));
