// How far the Straube scan sits from true ground, as a smooth field rather than one number for the slice. align.ts
// measures each 500 m tile's shift against today's buildings (cache/<slice>/align_straube_alkis.json, or the file a
// city sheet borrows: paths.ts `align`); the slice's
// median (0.5 m east, 0.5 m south on friedrichstadt) is right within 1.5 m on most tiles, but a few sit 2 m further
// (the east edge). A shift per tile would tear the seams, since the scan runs on unbroken from tile to tile, so each
// tile's shift is pinned at its centre and read between centres bilinearly. A tile's own shift counts only where its
// measurement is sure: the best shift beats no shift by at least GAIN in score, over at least POINTS outline points (the
// Tiergarten tile, 274 points, says 7 m south and is not believed), and lands within FAR of the median (a shift of a
// street's width or more matched one row of houses to the next: 9 such on the city's 385 tiles, none on friedrichstadt,
// whose farthest sure tile is 2.1 m out); elsewhere the median stands. The city's file (cache/berlin) leaves out the
// tiles the plan doesn't draw (268 blank, beyond the 1910 boundary), so they don't pull the median to zero.
//   import { offsetField } from "./offsetfield"   const at = await offsetField(align); at(x, y) -> [dx, dy]
//   bun offsetfield.ts SLICE.json IN.geojson OUT.geojson   moves every vertex by median - field (for trace.sh, whose
//   polygons already have the median taken off), and prints the largest move
import { slicePaths } from "./paths";

const GAIN = 0.05, POINTS = 2000, FAR = 6, TILE = 500;
type Shift = { dx: number; dy: number; score: number; score0: number; points: number };

export async function offsetField(align: string) {
  const all: Record<string, Shift> = await Bun.file(align).json();
  const vals = Object.values(all), med = (k: "dx" | "dy") => vals.map((a) => a[k]).sort((a, b) => a - b)[vals.length >> 1];
  const median: [number, number] = [med("dx"), med("dy")];
  const pin = new Map<string, [number, number]>();
  for (const [id, a] of Object.entries(all)) {
    const sure = a.score - a.score0 >= GAIN && a.points >= POINTS && Math.hypot(a.dx - median[0], a.dy - median[1]) <= FAR;
    pin.set(id, sure ? [a.dx, a.dy] : median);
  }
  const ids = [...pin.keys()].map((id) => id.split("_").map((v) => Number(v) * 100));
  const X0 = Math.min(...ids.map((p) => p[0])), Y0 = Math.min(...ids.map((p) => p[1]));
  const nx = Math.max(...ids.map((p) => p[0])) / TILE - X0 / TILE + 1, ny = Math.max(...ids.map((p) => p[1])) / TILE - Y0 / TILE + 1;
  const node = (i: number, j: number) => pin.get(`${(X0 + i * TILE) / 100}_${(Y0 + j * TILE) / 100}`) ?? median;
  const at = (x: number, y: number): [number, number] => {
    const fx = Math.min(Math.max((x - X0) / TILE - 0.5, 0), nx - 1.001), fy = Math.min(Math.max((y - Y0) / TILE - 0.5, 0), ny - 1.001);
    const i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j;
    return [0, 1].map((c) => (node(i, j)[c] * (1 - a) + node(i + 1, j)[c] * a) * (1 - b) + (node(i, j + 1)[c] * (1 - a) + node(i + 1, j + 1)[c] * a) * b) as [number, number];
  };
  return Object.assign(at, { median, sure: [...pin].filter(([, v]) => v !== median).length });
}

if (import.meta.main) {
  const [slicePath, inFile, outFile] = process.argv.slice(2);
  const { align } = await slicePaths(slicePath);
  const at = await offsetField(align), [mx, my] = at.median;
  const fc = await Bun.file(inFile).json();
  let worst = 0;
  const move = (c: any): any => {
    if (typeof c[0] === "number") {
      const [fx, fy] = at(c[0], c[1]), ux = mx - fx, uy = my - fy;
      worst = Math.max(worst, Math.hypot(ux, uy));
      return [+(c[0] + ux).toFixed(3), +(c[1] + uy).toFixed(3), ...c.slice(2)];
    }
    return c.map(move);
  };
  for (const f of fc.features) if (f.geometry) f.geometry.coordinates = move(f.geometry.coordinates);
  await Bun.write(outFile, JSON.stringify(fc));
  console.log(`offset field: ${at.sure} tiles on their own shift, the rest on the median (${mx} m east, ${my} m north); largest move ${worst.toFixed(2)} m`);
}
