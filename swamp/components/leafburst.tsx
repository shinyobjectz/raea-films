// v5 (note 9): the blast throws the leaves up. Torn off the plants round the pit, they're flung up out of it with the
// earth, slowed hard by the air in a few frames (a leaf has next to no weight for its size), then come down as leaves
// do, swinging from side to side and tipping into each swing, turning slowly, and settle on the bank or float on the
// water. Real leaves: scanned ivy leaves (ambientCG LeafSet029, CC0) tinted as fresh and dry leaves
// (scripts/make_leafburst.py), one model a leaf. They're mounted from 25-crack's first frame, shrunk to nothing until the blast (a model mounted
// mid-shot never draws in a video render).
import { staticFile } from "raea";
import { Model, eulerOf } from "raea/3d";
import { BEAM_AT } from "./groundbeam";
import { groundAt, onBank } from "./ground";
import { PIT } from "./opening";
import { type Q, qa, qm } from "./quat";
import { T, type V3, rnd } from "./timeline";

const [CX, CY, CZ] = BEAM_AT;
const N = 44;
const src = (k: number) => staticFile(`models/leafburst/leaf.c${k}.gltf`);
/** metres a frame: the leaves' fall once the air has them, and how fast it takes them (frames) */
const FALL = 0.024, TAU = 5.5;
/** how far under the bank a leaf waits for the blast (m) */
const PARK = 40;

const LEAVES = Array.from({ length: N }, (_, i) => {
  const r = (k: number) => rnd(i, 200 + k);
  const a = r(1) * Math.PI * 2, d = Math.sqrt(r(2)) * (PIT + 0.12);
  const x = CX + Math.cos(a) * d, z = CZ + Math.sin(a) * d;
  // thrown up hardest from the middle, out from it, a little each its own way
  const up = (0.13 + 0.12 * r(3)) * (1 - 0.4 * (d / (PIT + 0.12)));
  const out = 0.02 + 0.05 * r(4);
  return {
    p: [x, groundAt(x, z) + 0.01, z] as V3,
    v: [Math.cos(a) * out + (r(5) - 0.5) * 0.03, up, Math.sin(a) * out + (r(6) - 0.5) * 0.03] as V3,
    born: T.blast + Math.floor(r(7) * 3),
    size: 0.05 + 0.04 * r(8),
    k: r(9) < 0.8 ? Math.floor(r(21) * 7) : 7 + Math.floor(r(21) * 2), // mostly green, one in five dry and broken
    // the swing: its line (a heading), how wide, how long a swing takes (frames), where it starts
    swingA: r(10) * Math.PI * 2,
    swingW: 0.05 + 0.07 * r(11),
    swingT: 22 + 16 * r(12),
    swingP: r(13) * Math.PI * 2,
    // its tumble as it's thrown, and its slow turn as it falls
    tumbleAx: [r(14) - 0.5, r(15) - 0.5, r(16) - 0.5] as V3,
    tumble: 0.35 + 0.4 * r(17),
    turn: (r(18) - 0.5) * 0.08,
    drift: [(r(19) - 0.5) * 0.004, (r(20) - 0.5) * 0.004] as [number, number],
  };
});
type Leaf = (typeof LEAVES)[number];

/** where leaf l is at frame f, its turn, and whether it's down */
const leafAt = (l: Leaf, f: number): { p: V3; q: Q } | null => {
  const t = f - l.born;
  if (t < 0) return null;
  // the air takes it: its throw dies away over TAU frames, leaving its fall and a little drift
  const e = TAU * (1 - Math.exp(-t / TAU));
  const term: V3 = [l.drift[0], -FALL, l.drift[1]];
  const p: V3 = [0, 1, 2].map((i) => l.p[i] + term[i] * t + (l.v[i] - term[i]) * e) as V3;
  // and swings, once it's falling: from side to side along its line, tipping into each swing
  const s = Math.min(1, Math.max(0, (t - 8) / 14));
  const ph = (2 * Math.PI * t) / l.swingT + l.swingP;
  const sx = Math.cos(l.swingA), sz = Math.sin(l.swingA);
  p[0] += sx * l.swingW * Math.sin(ph) * s;
  p[2] += sz * l.swingW * Math.sin(ph) * s;
  // it rises a little at each end of a swing, as a falling leaf does
  p[1] += 0.25 * l.swingW * (1 - Math.cos(2 * ph)) * 0.5 * s;
  // down: on the bank it lies where it fell; on the water it floats
  const floor = onBank(p[0], p[2]) ? groundAt(p[0], p[2]) + 0.004 : -0.015;
  const down = p[1] <= floor;
  if (down) p[1] = floor;
  // its tumble dies with its throw; then it lies about flat, tipped into its swing, turning slowly
  const tumble = qa(l.tumbleAx, l.tumble * e);
  const tip = qa([-sz, 0, sx], down ? 0.08 : 0.55 * Math.cos(ph) * s);
  const spin = qa([0, 1, 0], l.swingA + l.turn * t);
  return { p, q: qm(tip, qm(spin, down ? [0, 0, 0, 1] : qm(tumble, [0, 0, 0, 1]))) };
};

export function LeafBurst({ f }: { f: number }) {
  return (
    <>
      {LEAVES.map((l, i) => {
        const s = leafAt(l, f);
        // waiting, shrunk to nothing, PARK metres down, until it's thrown (anywhere near the slab, even a metre under it,
        // the shrunk leaves turned its mud into a mirror-like lattice of light and dark at 1080); a frame before its
        // throw it moves, still shrunk, to where it's thrown from, so the motion blur that's on from the blast never
        // sees it come up from PARK metres down
        if (!s) return <Model key={i} name={`leaf-${i}`} allowOverlap src={src(l.k)} position={f >= l.born - 1 ? l.p : [CX, CY - PARK, CZ]} scale={1e-4} shadow={false} />;
        return <Model key={i} name={`leaf-${i}`} allowOverlap src={src(l.k)} position={s.p} rotation={eulerOf(s.q)} scale={l.size} shadow={false} />;
      })}
    </>
  );
}
