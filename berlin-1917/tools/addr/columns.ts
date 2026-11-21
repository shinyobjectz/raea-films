// The text columns of an Adreßbuch page (eight to a page). The columns are set off by printed vertical rules, some of
// them faint: rules are found as vertical runs of ink 120 px or longer (a morphological open), kept when they sit on
// the page's regular column pitch, and a missing one is put back one pitch from its neighbour.
//   bun columns.ts PAGE.jpg   prints "x0 x1" for each text column, left to right
const file = process.argv[2];
const { stdout } = Bun.spawnSync(["magick", file, "-colorspace", "gray", "-negate", "-threshold", "50%", "-morphology", "Open", "rectangle:1x120",
  "-scale", "x1!", "-depth", "8", "gray:-"]);
const m = new Uint8Array(stdout), W = m.length;

// Peaks: runs of image columns with ink, each kept at its strongest column.
const peaks: { x: number; v: number }[] = [];
for (let x = 0; x < W; x++) {
  if (m[x] <= 6) continue;
  const last = peaks[peaks.length - 1];
  if (last && x - last.x <= 30) { if (m[x] > last.v) Object.assign(last, { x, v: m[x] }); }
  else peaks.push({ x, v: m[x] });
}
// The page's border lines are the darkest runs (a rule the height of the page); without one the edge is the image's.
const border = peaks.filter((p) => p.v >= 100);
const left = border.find((p) => p.x < 200)?.x ?? 0, right = [...border].reverse().find((p) => p.x > W - 250)?.x ?? W;
const inner = peaks.filter((p) => p.v >= 20 && p.x > left + 150 && p.x < right - 150);
// The pitch: the median gap between neighbouring rules that is about one column (280-400 px).
const gaps = inner.slice(1).map((p, i) => p.x - inner[i].x).filter((g) => g > 280 && g < 400).sort((a, b) => a - b);
if (!gaps.length) throw new Error(`${file}: no column rules found`);
const pitch = gaps[gaps.length >> 1];
// Keep the rules that sit on that pitch from some other rule (a diagram's lines do not).
const onGrid = (p: { x: number }) => inner.some((q) => q !== p && Math.abs(Math.abs(q.x - p.x) / pitch - Math.round(Math.abs(q.x - p.x) / pitch)) * pitch < 20 && Math.abs(q.x - p.x) < pitch * 3.5);
const rules = inner.filter(onGrid).map((p) => p.x);
// Put back missing rules: one pitch on from the nearer kept rule (the page edge is not on the pitch).
const xs = [left, ...rules, right];
for (let i = 0; i + 1 < xs.length; i++) {
  const gap = xs[i + 1] - xs[i];
  if (gap < pitch * 1.5) continue;
  const fromRight = i === 0, n = Math.round(gap / pitch) - 1 || 1;
  const add = Array.from({ length: n }, (_, k) => (fromRight ? xs[i + 1] - (k + 1) * pitch : xs[i] + (k + 1) * pitch)).filter((x) => x > xs[i] + 150 && x < xs[i + 1] - 150);
  xs.splice(i + 1, 0, ...add.sort((a, b) => a - b));
  i += add.length;
}
// A rule closer than 0.6 pitch to the one before is a stray line (the first column, with its house numbers, is
// wider than the rest): the weaker of the two goes, never a page edge.
const strength = (x: number) => peaks.find((p) => p.x === x)?.v ?? 0;
for (let i = 1; i < xs.length; i++) {
  if (xs[i] - xs[i - 1] >= pitch * 0.6) continue;
  const drop = i === xs.length - 1 ? i - 1 : i - 1 === 0 ? i : strength(xs[i]) < strength(xs[i - 1]) ? i : i - 1;
  xs.splice(drop, 1);
  i--;
}
for (let i = 0; i + 1 < xs.length; i++) console.log(xs[i] + 8, xs[i + 1] - 8);
