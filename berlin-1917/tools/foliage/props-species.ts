// Each of the world's tree props as its 1917 species (docs/foliage.feature FO11), for City.tsx's Props once a look has
// a day: the props are the world lane's (assets/world/friedrichstadt/props.json, kinds lime-bare-0..2, bake.ts), the
// species the map's (map/1917/tree_species.json, tools/map/species.ts). A prop placed from a 1928 crown takes the
// species, variant and size of the map's tree within MATCH m of it; one planted to fill a park's canopy takes its
// grove's species (species-mix.ts parkSpecies), a variant by its spot, its width from the prop's scale (the bare
// lime's 13.5 m crown times it, as bake.ts sized it) and its height from the species' habit, 2.5 m clear.
// in:  tools/foliage/lods.json, the grown trees (raea-sys-foliage requests: id tree-SPECIES-V-lN, its height and width)
// out: assets/foliage/species.json { source, fields, grown: { "SPECIES-V": [width, height] }, trees: { "x,z": [...] } },
//      keyed by the prop's x and z as props.json writes them, and a count printed.
//   bun tools/foliage/props-species.ts
import { readFileSync, writeFileSync } from "node:fs";
import { HABIT, VARIANTS, hash, parkSpecies, type Species } from "../map/species-mix";

const ROOT = `${import.meta.dir}/../..`;
const MATCH = 1.5;
const BARE_CROWN = 13.5;

const props = JSON.parse(readFileSync(`${ROOT}/assets/world/friedrichstadt/props.json`, "utf8")).props as Record<string, number[][]>;
const map = JSON.parse(readFileSync(`${ROOT}/map/1917/tree_species.json`, "utf8")).trees as [number, number, Species, number, number, number, number][];
const lods = JSON.parse(readFileSync(`${import.meta.dir}/lods.json`, "utf8")) as { id: string; width: number; height: number }[];

const grown: Record<string, [number, number]> = {};
for (const r of lods) {
  const m = /^tree-([a-z]+)-(\d+)-l0$/.exec(r.id);
  if (m) grown[`${m[1]}-${m[2]}`] = [r.width, r.height];
}

// the map's trees in 5 m cells
const cells = new Map<string, number[]>();
map.forEach((t, i) => {
  const k = `${Math.floor(t[0] / 5)},${Math.floor(t[1] / 5)}`;
  (cells.get(k) ?? cells.set(k, []).get(k)!).push(i);
});
const nearest = (e: number, n: number) => {
  let best = -1, d = MATCH;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    for (const i of cells.get(`${Math.floor(e / 5) + dx},${Math.floor(n / 5) + dy}`) ?? []) {
      const h = Math.hypot(map[i][0] - e, map[i][1] - n);
      if (h < d) (d = h), (best = i);
    }
  }
  return best;
};

const trees: Record<string, (string | number)[]> = {};
const count = new Map<string, number>();
let matched = 0, filled = 0;
for (const [kind, list] of Object.entries(props)) {
  if (!kind.startsWith("lime-bare-")) continue;
  for (const p of list) {
    const e = p[0] + 391000, n = 5819000 - p[2];
    const i = nearest(e, n);
    let row: (string | number)[];
    if (i >= 0) {
      const t = map[i];
      row = [t[2], t[3], t[4], t[5], t[6]];
      matched++;
    } else {
      const spot = Math.round(p[0] * 10) * 7919 + Math.round(p[2] * 10);
      const s = parkSpecies(e, n, spot);
      const width = Math.round(p[4] * BARE_CROWN * 10) / 10;
      row = [s, Math.floor(hash(spot, 9) * VARIANTS[s]), width, Math.round(Math.min(width * HABIT[s], s === "poplar" ? 30 : 28) * 10) / 10, 2.5];
      filled++;
    }
    if (!grown[`${row[0]}-${row[1]}`]) throw new Error(`no grown tree ${row[0]}-${row[1]} in lods.json`);
    trees[`${p[0]},${p[2]}`] = row;
    count.set(row[0] as string, (count.get(row[0] as string) ?? 0) + 1);
  }
}
writeFileSync(`${ROOT}/assets/foliage/species.json`, JSON.stringify({ source: "tools/foliage/props-species.ts: props.json's tree props with map/1917/tree_species.json", fields: ["species", "variant", "width", "height", "clear"], grown, trees }));
console.log(`${matched + filled} tree props: ${matched} from the map's trees, ${filled} park fill by grove`);
console.log([...count].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));
