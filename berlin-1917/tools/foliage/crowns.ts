// Crowns measured the same way on photographs and on raea/foliage's side views (docs/foliage.feature FO12), so a
// grown crown is held to real ones, not to an eye:
//   1. the tree: a photo's sky is told by its colour (blue over red, or bright and grey under cloud) and the rest is
//      tree, with the ground cut at the horizon (the first rows mostly not sky); a side view is its white
//   2. the crown: the biggest piece left, refused if it touches the frame's top or sides (cut off, or not alone),
//      from its top down to the last row at least a quarter as wide as its widest (below is trunk)
//   3. at one scale: the crown resampled to 200 px across (a box filter, then half), so leaves and noise don't count
//   4. its numbers: solidity, its outline's area (holes filled) over its convex hull's (a ball is near 1; lobes and
//      notches take it down); rough, its outline's length over the hull's perimeter; sky, the holes over the
//      outline's area; aspect, height over width
//   bun tools/foliage/crowns.ts photo|mask FILE... [--json OUT.json] [--masks DIR]
import { mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const kind = args[0];
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const files = args.slice(1).filter((a, i, all) => !a.startsWith("--") && !["--json", "--masks", "--boxes"].includes(all[i - 1]));
// --boxes FILE.tsv: a photo's crown by hand (file, then x0 y0 x1 y1 as shares of the frame, y1 at the crown's base);
// inside a box nothing is cut at a horizon and touching the box is allowed
const boxes = new Map<string, number[]>();
for (const line of opt("--boxes") ? (await Bun.file(opt("--boxes")!).text()).split("\n") : []) {
  const [f, ...v] = line.split("\t");
  if (f && !f.startsWith("#") && v.length >= 4) boxes.set(f, v.slice(0, 4).map(Number));
}
const boxFor = (file: string) => [...boxes].find(([k]) => file.endsWith(k))?.[1];
const masks = opt("--masks");
if (masks) mkdirSync(masks, { recursive: true });
const W = 200;

type Img = { w: number; h: number; on: Uint8Array };

function load(file: string): Img {
  const p = Bun.spawnSync(["magick", file, "-auto-orient", "-resize", "700x700>", "ppm:-"]);
  if (p.exitCode) throw new Error(`${file}: ${p.stderr}`);
  const b = p.stdout as Buffer;
  let at = 0;
  const word = () => {
    while (/\s/.test(String.fromCharCode(b[at]))) at++;
    const s = at;
    while (!/\s/.test(String.fromCharCode(b[at]))) at++;
    return b.toString("latin1", s, at);
  };
  word();
  const [w, h] = [+word(), +word()];
  word();
  at++;
  const on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const [r, g, bl] = [b[at + 3 * i], b[at + 3 * i + 1], b[at + 3 * i + 2]];
    if (kind === "mask") on[i] = r > 127 ? 1 : 0;
    else {
      const lum = 0.3 * r + 0.59 * g + 0.11 * bl;
      const sky = (bl > r + 12 && bl > g - 6 && lum > 95) || (lum > 180 && Math.max(r, g, bl) - Math.min(r, g, bl) < 40);
      on[i] = sky ? 0 : 1;
    }
  }
  return { w, h, on };
}

/** Pixel pieces (4-connected) of `on`, as a label per pixel and each piece's size. */
function pieces(m: Img): { label: Int32Array; sizes: number[] } {
  const label = new Int32Array(m.w * m.h).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let s = 0; s < m.w * m.h; s++) {
    if (!m.on[s] || label[s] >= 0) continue;
    const id = sizes.length;
    let n = 0;
    label[s] = id;
    stack.push(s);
    while (stack.length) {
      const i = stack.pop()!;
      n++;
      const x = i % m.w;
      for (const j of [x > 0 ? i - 1 : -1, x < m.w - 1 ? i + 1 : -1, i - m.w, i + m.w]) {
        if (j >= 0 && j < m.w * m.h && m.on[j] && label[j] < 0) {
          label[j] = id;
          stack.push(j);
        }
      }
    }
    sizes.push(n);
  }
  return { label, sizes };
}

function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], hi: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of p.reverse()) {
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

function crop(m: Img, b: number[]): Img {
  const [x0, y0, x1, y1] = [Math.round(b[0] * m.w), Math.round(b[1] * m.h), Math.round(b[2] * m.w), Math.round(b[3] * m.h)];
  const [w, h] = [x1 - x0, y1 - y0];
  const on = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) on.set(m.on.subarray((y0 + y) * m.w + x0, (y0 + y) * m.w + x1), y * w);
  return { w, h, on };
}

function measure(file: string) {
  const box = boxFor(file);
  const m = box ? crop(load(file), box) : load(file);
  // the horizon: the first of five rows running that are each mostly not sky (a photo; a side view has none)
  let horizon = m.h;
  if (kind === "photo" && !box) {
    const full = (y: number) => m.on.subarray(y * m.w, (y + 1) * m.w).reduce((a, b) => a + b, 0) / m.w > 0.8;
    for (let y = 0; y + 5 < m.h; y++) if ([0, 1, 2, 3, 4].every((k) => full(y + k))) { horizon = y; break; }
    m.on.fill(0, horizon * m.w);
  }
  const { label, sizes } = pieces(m);
  if (!sizes.length) return { file, why: "no tree" };
  const id = sizes.indexOf(Math.max(...sizes));
  const ext = new Map<number, [number, number]>();
  for (let i = 0; i < m.w * m.h; i++) {
    if (label[i] !== id) continue;
    const [x, y] = [i % m.w, Math.floor(i / m.w)];
    const e = ext.get(y) ?? [x, x];
    ext.set(y, [Math.min(e[0], x), Math.max(e[1], x)]);
  }
  const ys = [...ext.keys()].sort((a, b) => a - b);
  const [x0, x1] = [Math.min(...[...ext.values()].map((e) => e[0])), Math.max(...[...ext.values()].map((e) => e[1]))];
  if (!box && (ys[0] <= 1 || x0 <= 1 || x1 >= m.w - 2)) return { file, why: "touches the frame" };
  const widest = Math.max(...[...ext.values()].map((e) => e[1] - e[0]));
  const crownRows = ys.filter((y) => ext.get(y)![1] - ext.get(y)![0] >= widest / 4);
  const [top, bottom] = [crownRows[0], crownRows[crownRows.length - 1]];
  if (widest < 100) return { file, why: `small (${widest} px)` };
  if (horizon < m.h && bottom >= horizon - 2) return { file, why: "crown reaches the horizon" };
  // resample the crown's box to W across: each cell the share of its source pixels in the crown, kept over half
  const s = (x1 - x0 + 1) / W;
  const H = Math.ceil((bottom - top + 1) / s);
  const on = new Uint8Array(W * H);
  for (let Y = 0; Y < H; Y++) {
    for (let X = 0; X < W; X++) {
      let n = 0, k = 0;
      for (let y = Math.floor(top + Y * s); y < Math.min(bottom + 1, Math.max(Math.floor(top + Y * s) + 1, Math.floor(top + (Y + 1) * s))); y++) {
        for (let x = Math.floor(x0 + X * s); x < Math.min(x1 + 1, Math.max(Math.floor(x0 + X * s) + 1, Math.floor(x0 + (X + 1) * s))); x++) {
          n++;
          k += label[y * m.w + x] === id ? 1 : 0;
        }
      }
      on[Y * W + X] = n && k / n >= 0.5 ? 1 : 0;
    }
  }
  // holes: what the outside can't reach
  const outside = new Uint8Array((W + 2) * (H + 2));
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : on[y * W + x]);
  const stack = [0];
  outside[0] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const [x, y] = [(i % (W + 2)) - 1, Math.floor(i / (W + 2)) - 1];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [u, v] = [x + dx, y + dy];
      if (u < -1 || v < -1 || u > W || v > H) continue;
      const j = (v + 1) * (W + 2) + (u + 1);
      if (!outside[j] && !at(u, v)) {
        outside[j] = 1;
        stack.push(j);
      }
    }
  }
  let area = 0, holes = 0, edge = 0;
  const pts: [number, number][] = [];
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && !outside[(y + 1) * (W + 2) + (x + 1)];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!filled(x, y)) continue;
      area++;
      if (!on[y * W + x]) holes++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!filled(x + dx, y + dy)) edge++;
      pts.push([x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]);
    }
  }
  const h = hull(pts);
  let ha = 0, hp = 0;
  for (let i = 0; i < h.length; i++) {
    const [a, b] = [h[i], h[(i + 1) % h.length]];
    ha += a[0] * b[1] - b[0] * a[1];
    hp += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  ha = Math.abs(ha) / 2;
  // the outline at a clump's scale: the filled crown blurred over 4% of its width (three box passes) and cut at half,
  // so leaves' fringe goes and clumps' bumps stay; its solidity is the lobing (a smooth egg near 1)
  let soft = Float32Array.from({ length: W * H }, (_, i) => (filled(i % W, Math.floor(i / W)) ? 1 : 0));
  const R = Math.round(W * 0.04 / 1.7);
  for (let pass = 0; pass < 6; pass++) {
    const next = new Float32Array(W * H);
    const horiz = pass % 2 === 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let sum = 0, n = 0;
        for (let k = -R; k <= R; k++) {
          const [u, v] = horiz ? [x + k, y] : [x, y + k];
          if (u >= 0 && v >= 0 && u < W && v < H) { sum += soft[v * W + u]; n++; }
        }
        next[y * W + x] = sum / n;
      }
    }
    soft = next;
  }
  const lumpy: [number, number][] = [];
  let lumpArea = 0;
  for (let i = 0; i < W * H; i++) if (soft[i] >= 0.5) { lumpArea++; const [x, y] = [i % W, Math.floor(i / W)]; lumpy.push([x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]); }
  const lh = hull(lumpy);
  let la = 0;
  for (let i = 0; i < lh.length; i++) la += lh[i][0] * lh[(i + 1) % lh.length][1] - lh[(i + 1) % lh.length][0] * lh[i][1];
  // the profile: where it's widest (up from its base, of its height) and its skirt (its width 15% up, of its widest)
  const rowW = Array.from({ length: H }, (_, y) => { let a = W, b = -1; for (let x = 0; x < W; x++) if (filled(x, y)) { a = Math.min(a, x); b = x; } return b < a ? 0 : b - a + 1; });
  const most = Math.max(...rowW);
  const widestUp = (H - 1 - rowW.indexOf(most)) / H;
  const skirt = rowW[Math.max(0, H - 1 - Math.floor(0.15 * H))] / most;
  if (masks) {
    const pgm = Buffer.concat([Buffer.from(`P5 ${W} ${H} 255\n`), Buffer.from(Array.from({ length: W * H }, (_, i) => (on[i] ? 255 : filled(i % W, Math.floor(i / W)) ? 90 : 0)))]);
    const p = Bun.spawnSync(["magick", "pgm:-", `${masks}/${file.split("/").slice(-3).join("-").replace(/\.\w+$/, "")}.png`], { stdin: pgm });
    if (p.exitCode) throw new Error(String(p.stderr));
  }
  const r = (v: number) => Math.round(v * 1000) / 1000;
  return { file, solidity: r(area / ha), rough: r(edge / hp), sky: r(holes / area), aspect: r(H / W), lobing: r(lumpArea / (Math.abs(la) / 2)), widest: r(widestUp), skirt: r(skirt) };
}

const out = files.map((f) => {
  try {
    return measure(f);
  } catch (e) {
    return { file: f, why: String(e).slice(0, 120) };
  }
});
for (const o of out) console.log(basename(o.file).padEnd(16), "why" in o ? `skip: ${o.why}` : `solidity ${o.solidity} rough ${o.rough} sky ${o.sky} aspect ${o.aspect} lobing ${o.lobing} widest ${o.widest} skirt ${o.skirt}`);
const json = opt("--json");
if (json) writeFileSync(json, JSON.stringify(out, null, 1));
