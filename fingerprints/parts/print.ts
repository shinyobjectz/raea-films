// A fingerprint, drawn rather than scanned: a whorl of ridges spiralling out from its core, its lower turns flattened
// toward the crease, flatter arcs across the base, ridge endings, forks and the odd island, all clipped to the
// finger's pad. Unit space: the pad is about 1.9 wide and 2.5 tall, centred on 0,0. The ridges come back in the order
// a pen would draw them, core first.
import { type Line, type Pt, hash, noise1, noise2, resample } from "./ink";

export type Ridge = { line: Line; ring: number };

export const pad = (p: Pt) => {
  const [x, y] = p;
  const top = y < 0 ? 1.3 : 1.18;
  const half = y < 0 ? 0.9 : 0.97;
  return (x / half) ** 2 + (y / top) ** 2 < 1 && y < 1.0;
};

export function fingerprint(seed = 3, gap = 0.043): Ridge[] {
  const out: Ridge[] = [];
  const core: Pt = [0.03, -0.22];
  const seam = (x: number) => 0.5 + 0.14 * Math.cos(x * 1.9) - 0.05 * x;
  const turns = 26;
  const N = 6000;
  let ring = 0;
  let cur: Line = [];
  const flush = () => {
    if (cur.length > 5) out.push({ line: resample(cur, 0.01), ring });
    cur = [];
  };
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * Math.PI * 2 + 0.6;
    ring = Math.floor(t * turns);
    const R = 0.035 + gap * (t * turns);
    // low-frequency warping, continuous around the circle, growing outward
    const warp = (noise2(Math.cos(a) * 1.2 + 5, Math.sin(a) * 1.2 + 5, seed) - 0.5) * 0.16 * Math.min(1, R * 1.4);
    const fine = (noise2(Math.cos(a) * 3 + R * 4, Math.sin(a) * 3, seed + 9) - 0.5) * 0.012;
    const r = R * (1 + warp) + fine;
    let x = core[0] + Math.cos(a) * r * 0.9 + Math.sin(a * 0.5 + 1) * 0.015;
    let y = core[1] + Math.sin(a) * r * 1.22;
    // the lower turns flatten toward the crease
    if (y > core[1]) y = core[1] + (y - core[1]) * (0.9 - 0.08 * Math.min(1, R));
    // and the whole whorl leans a little
    x += (y - core[1]) * 0.08;
    const p: Pt = [x, y];
    const keep = pad(p) && y < seam(x);
    // a ridge ending: a short gap now and then, more often far from the core
    const block = Math.floor(i / 22);
    const end = hash(seed, block) < 0.03 + 0.03 * R && i % 22 < 2;
    if (keep && !end) cur.push(p);
    else flush();
  }
  flush();
  // the base: arcs bowing up under the whorl, flattening toward the crease
  for (let k = 0, y0 = 0.4; y0 < 1.0; k++, y0 += gap) {
    cur = [];
    for (let x = -1.0; x <= 1.0; x += 0.008) {
      const depth = Math.min(1, (y0 - 0.4) / 0.6);
      const bow = (0.26 - 0.2 * depth) * Math.exp(-((x - 0.05) ** 2) * 1.3);
      const y = y0 - bow + (noise1(x * 2.2 + k * 0.7, seed + 40) - 0.5) * 0.03 + x * 0.04;
      const p: Pt = [x, y];
      const end = hash(seed, k, Math.floor((x + 2) * 9)) < 0.06 && Math.floor((x + 2) * 125) % 10 < 1;
      if (pad(p) && y >= seam(x) + 0.005 && !end) cur.push(p);
      else if (cur.length) {
        if (cur.length > 5) out.push({ line: cur, ring: turns + k });
        cur = [];
      }
    }
    if (cur.length > 5) out.push({ line: cur, ring: turns + k });
  }
  // forks: a short ridge branching off a long one
  const longOnes = out.filter((r) => r.line.length > 40);
  for (let k = 0; k < 14; k++) {
    const r = longOnes[Math.floor(hash(seed, k, 7) * longOnes.length)];
    if (!r) continue;
    const at = Math.floor(r.line.length * (0.2 + hash(seed, k, 8) * 0.6));
    const p = r.line[at];
    const q = r.line[Math.min(r.line.length - 1, at + 6)];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const side = hash(seed, k, 9) < 0.5 ? 1 : -1;
    const branch: Line = [];
    for (let s = 0; s < 14; s++) {
      const u = s / 13;
      branch.push([p[0] + dx / len * u * 0.11 + nx * side * gap * 0.5 * Math.sin((u * Math.PI) / 2), p[1] + dy / len * u * 0.11 + ny * side * gap * 0.5 * Math.sin((u * Math.PI) / 2)]);
    }
    if (branch.every((b) => pad(b))) out.push({ line: branch, ring: r.ring });
  }
  // a few islands (dots and dashes between ridges)
  for (let k = 0; k < 12; k++) {
    const a = hash(seed, k, 1) * Math.PI * 2;
    const r = 0.2 + hash(seed, k, 2) * 0.6;
    const x = core[0] + Math.cos(a) * r * 0.9;
    const y = core[1] + Math.sin(a) * r * 1.1;
    if (!pad([x, y])) continue;
    const l = 0.008 + hash(seed, k, 3) * 0.022;
    const ang = a + Math.PI / 2;
    out.push({ line: [[x - Math.cos(ang) * l, y - Math.sin(ang) * l], [x, y], [x + Math.cos(ang) * l, y + Math.sin(ang) * l]], ring: Math.floor(r / gap) });
  }
  return out.sort((p, q) => p.ring - q.ring);
}

/** the pad's outline, for a stamp's edge or a clip */
export function padOutline(n = 160): Line {
  const pts: Line = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.sin(a);
    pts.push([Math.cos(a) * (s < 0 ? 0.9 : 0.97), Math.min(1.0, s * (s < 0 ? 1.3 : 1.18))]);
  }
  return pts;
}
