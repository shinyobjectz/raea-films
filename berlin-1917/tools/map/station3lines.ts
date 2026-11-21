// Pumpstation III's own channels, pipes and chambers from Hobrecht's Blatt 16 (station3.ts -> map/1917/station_iii.geojson)
// put into the sewer layers in place of what the traced network (Blatt 4, 1:7500) has there. On Blatt 16 the trunks end
// in the Sandfang, the Verbindungskanal runs on to the distribution well in front of the pump hall (the gravity system's
// end, its root), the Nothauslass runs from the well under the Ufer to the canal, and the delivery pipes leave the pump
// hall (Blatt 17: two of 0.525 m) for the pressure main of Blatt 26. The traced line from the Sandfang to the root, which
// the routing sized as the whole system's last pipe, is replaced by the Verbindungskanal.
// Sizes: the Verbindungskanal 2.245 m wide (Blatt 9's screen in the sand trap's outlet), its section ASSUMED the
// outlet's arch; the Nothauslass 2.2 m wide under a 1.1 m half-round crown, falling 1:119 (Blatt 9), its invert at the
// well ASSUMED the root's; the joined main's bore not printed (ASSUMED 0.75 m, about the two 0.525 m pipes' area), 2.0 m
// under the street (Blatt 26).
type F = { type: "Feature"; geometry: { type: string; coordinates: any }; properties: Record<string, unknown> };
const B16 = "Hobrecht 1884, Atlas Blatt 16 (fitted, station3.ts)";
const FALL_OUT = 1 / 119, MAIN = 0.75, PIPE = 0.525, MAIN_DEPTH = 2.0, CORRIDOR = 6, TRAP_R = 7.53;

export async function stationIII(map: string, lines: F[], points: F[], g: (x: number, y: number) => number, root: { x: number; y: number; z: number }): Promise<string> {
  const file = Bun.file(`${map}/station_iii.geojson`);
  if (!(await file.exists())) return "station_iii.geojson not there: III as traced";
  const fs = (await file.json()).features as F[], part = (p: string) => fs.find((f) => f.properties.part === p);
  const centre = (f: F) => { const r: number[][] = f.geometry.coordinates[0].slice(0, -1); return [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length]; };
  const sand = centre(part("Sandfang")!), well = [root.x, root.y];
  const len = (c: number[][]) => c.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - c[i - 1][0], q[1] - c[i - 1][1]) : 0), 0);
  // Gravity lines of III lying wholly in the sand trap or within CORRIDOR m of the Sandfang-to-root line go.
  const [ux, uy] = [well[0] - sand[0], well[1] - sand[1]], L = Math.hypot(ux, uy);
  const inside = ([x, y]: number[]) => {
    if (Math.hypot(x - sand[0], y - sand[1]) <= TRAP_R) return true;
    const a = ((x - sand[0]) * ux + (y - sand[1]) * uy) / L, d = Math.abs((x - sand[0]) * uy - (y - sand[1]) * ux) / L;
    return a >= 0 && a <= L + 3 && d <= CORRIDOR;
  };
  let gone = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const p = lines[i].properties;
    if (p.system === "III" && p.kind !== "pressure main" && (lines[i].geometry.coordinates as number[][]).every(inside)) (lines.splice(i, 1), gone++);
  }
  // The trap's invert: the lowest invert of III's lines ending in it, else the root's.
  let trapZ = Infinity;
  for (const l of lines) {
    const p = l.properties, c = l.geometry.coordinates as number[][];
    if (p.system !== "III" || p.invert_out === undefined) continue;
    if (Math.hypot(c.at(-1)![0] - sand[0], c.at(-1)![1] - sand[1]) <= TRAP_R + 1) trapZ = Math.min(trapZ, p.invert_out as number);
  }
  if (!isFinite(trapZ)) trapZ = root.z;
  trapZ = Math.max(trapZ, root.z);
  const add = (coords: number[][], props: Record<string, unknown>) =>
    lines.push({ type: "Feature", geometry: { type: "LineString", coordinates: coords.map((p) => p.map((v) => +v.toFixed(2))) }, properties: { system: "III", length_m: Math.round(len(coords)), in_slice: true, ...props } });
  const vk = [sand, well];
  add(vk, { kind: "arch channel", height_m: 1.12, width_m: 2.245, invert_in: +trapZ.toFixed(2), invert_out: +root.z.toFixed(2), depth_in: +(g(sand[0], sand[1]) - trapZ).toFixed(2), depth_out: +(g(well[0], well[1]) - root.z).toFixed(2),
    basis: `${B16}: Verbindungskanal from the Sandfang to the distribution well; 2.245 m wide (Blatt 9, the screen in the trap's outlet); section ASSUMED the outlet's half-round arch` });
  const out = part("Nothauslass")!.geometry.coordinates as number[][], outZ = root.z - len([well, ...out.slice(1)]) * FALL_OUT;
  add([well, ...out.slice(1)], { kind: "arch channel", height_m: 1.1, width_m: 2.2, invert_in: +root.z.toFixed(2), invert_out: +outZ.toFixed(2), depth_in: +(g(well[0], well[1]) - root.z).toFixed(2), depth_out: +(g(out.at(-1)![0], out.at(-1)![1]) - outZ).toFixed(2), slope: +FALL_OUT.toFixed(5),
    basis: `${B16}: Nothauslass (storm outlet) from the distribution well under Hallesches Ufer to the Landwehrkanal by the unloading ramp; 2.2 m wide, crown radius 1.1, falling 1:119, a cast-iron sluice in its mouth (Blatt 9); its invert at the well ASSUMED the root's` });
  for (const p of ["Druckrohr, pipe 1", "Druckrohr, pipe 2"]) add(part(p)!.geometry.coordinates, { kind: "pressure main", height_m: PIPE, width_m: PIPE, depth_in: MAIN_DEPTH, depth_out: MAIN_DEPTH,
    basis: `${B16}: delivery pipe from an air vessel through the pump hall's wall, 0.525 m (Blatt 17); depth ASSUMED the main's 2.0 m` });
  const main = [...part("Druckrohr")!.geometry.coordinates, ...part("Druckrohr, Blatt 26 route")!.geometry.coordinates.slice(1)];
  add(main, { kind: "pressure main", height_m: MAIN, width_m: MAIN, depth_in: MAIN_DEPTH, depth_out: MAIN_DEPTH,
    basis: "Hobrecht 1884, Atlas Blatt 16 (the joined main leaving the station) and Blatt 26 (its long section: Hallesches Ufer, over the Landwehrkanal at the Großbeerenbrücke at +36.06 with an air valve, Großbeerenstraße), routed down the middle of the 1917 street space; about 2.0 m under the street (Blatt 26); bore ASSUMED 0.75 m (not printed; the two 0.525 m delivery pipes' area)" });
  points.push({ type: "Feature", geometry: { type: "Point", coordinates: sand.map((v) => +v.toFixed(2)) }, properties: { kind: "sand trap", system: "III", name: "Sandfang, Pumpwerk III", invert: +trapZ.toFixed(2), depth: +(g(sand[0], sand[1]) - trapZ).toFixed(2), radius_m: TRAP_R,
    basis: `${B16} (the trap's place; drawn 13.1 m across at 1:500) and Blatt 9 (its basin, 7.53 m in radius round a 2.0 m well, which the 3D builds)` } });
  const air = part("Lufthahn");
  if (air) points.push({ type: "Feature", geometry: air.geometry, properties: { kind: "air valve", system: "III", name: "Lufthahn of III's pressure main", top: 36.06, basis: "Hobrecht 1884, Atlas Blatt 26: the main's high point over the Landwehrkanal at the Großbeerenbrücke" } });
  return `station III from Blatt 16: ${gone} traced lines at the station replaced by the Verbindungskanal (${Math.round(len(vk))} m, ${trapZ.toFixed(2)} to ${root.z.toFixed(2)}), Nothauslass ${Math.round(len([well, ...out.slice(1)]))} m to ${outZ.toFixed(2)}, pressure main ${Math.round(len(main))} m`;
}
