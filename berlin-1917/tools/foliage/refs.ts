// Photographs of whole trees (habit shots), per species, under permissive licences only (CC0, public domain mark,
// CC BY; never SA, NC or ND), found through Openverse (api.openverse.org, which indexes Wikimedia Commons, Flickr and
// others with their licences), for measuring raea/foliage's crowns against real ones (docs/foliage.feature FO1).
// Each species' candidates go to cache/tree-refs/<species>/list.json (title, licence, creator, landing page) and the
// pictures beside it, at 960 px (Wikimedia's own thumbnails; others at the size Openverse lists, under 4 MB).
// Kept out of git (cache/). Credits are in list.json and, for a picture used in a sheet, on the sheet.
//   bun tools/foliage/refs.ts [species ...]
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const OUT = `${import.meta.dir}/../../cache/${process.env.REFS_SET ?? "tree-refs"}`;
const UA = { "User-Agent": "map-research/1.0" };
const FLICKR: Record<string, string[]> = {
  lime: ["linden tree", "lime tree Tilia", "Linde Baum"],
  elm: ["elm tree", "Ulme Baum"],
  plane: ["plane tree Platanus", "Platane Baum"],
  maple: ["Norway maple tree", "Ahorn Baum"],
  chestnut: ["horse chestnut tree", "Kastanienbaum"],
  locust: ["black locust tree", "Robinie"],
  oak: ["oak tree field", "Eiche Baum"],
  birch: ["birch tree", "Birke Baum"],
  poplar: ["Lombardy poplar", "Pappel"],
  willow: ["willow tree", "Weide Baum"],
};
const SOLITARY: Record<string, string[]> = {
  lime: ["Naturdenkmal Linde", "solitary linden tree", "Sommerlinde Naturdenkmal"],
  elm: ["Naturdenkmal Ulme", "solitary elm tree"],
  plane: ["Naturdenkmal Platane", "solitary plane tree"],
  maple: ["Naturdenkmal Spitzahorn", "Naturdenkmal Ahorn", "solitary maple tree"],
  chestnut: ["Naturdenkmal Rosskastanie", "solitary horse chestnut tree"],
  locust: ["Naturdenkmal Robinie", "Robinie Baum"],
  oak: ["Naturdenkmal Eiche", "solitary oak tree", "Stieleiche Naturdenkmal"],
  birch: ["Naturdenkmal Birke", "solitary birch tree"],
  poplar: ["Pyramidenpappel", "Lombardy poplar row"],
  willow: ["Naturdenkmal Weide", "solitary willow tree"],
};
export const QUERIES: Record<string, string[]> = process.env.REFS_SET === "tree-solitary" ? SOLITARY : process.env.REFS_SET === "tree-flickr" ? FLICKR : {
  lime: ["Tilia cordata tree", "Tilia europaea tree"],
  elm: ["Ulmus glabra tree", "Ulmus minor tree"],
  plane: ["Platanus hispanica tree", "London plane tree"],
  maple: ["Acer platanoides tree"],
  chestnut: ["Aesculus hippocastanum tree"],
  locust: ["Robinia pseudoacacia tree"],
  oak: ["Quercus robur tree"],
  birch: ["Betula pendula tree"],
  poplar: ["Lombardy poplar", "Populus nigra Italica"],
  willow: ["Salix alba tree", "weeping willow tree"],
};

const thumb = (url: string) => {
  const m = url.match(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/);
  return m ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/960px-${m[3]}` : url;
};

for (const species of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(QUERIES)) {
  const dir = `${OUT}/${species}`;
  mkdirSync(dir, { recursive: true });
  const found = new Map<string, any>();
  for (const q of QUERIES[species]) {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=by,cc0,pdm&page_size=20&mature=false${process.env.REFS_SOURCE ? `&source=${process.env.REFS_SOURCE}` : ""}`;
    const r = await fetch(u, { headers: UA });
    if (!r.ok) throw new Error(`${u}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    for (const p of ((await r.json()) as any).results) {
      if (!["by", "cc0", "pdm"].includes(p.license) || (p.width && p.width < 800)) continue;
      found.set(p.id, { id: p.id, title: p.title, licence: `${p.license} ${p.license_version ?? ""}`.trim(), creator: p.creator, landing: p.foreign_landing_url, url: p.url, size: p.filesize, w: p.width, h: p.height });
    }
  }
  const list = [...found.values()];
  let got = 0;
  for (const [i, f] of list.entries()) {
    const file = `${dir}/${String(i).padStart(2, "0")}.jpg`;
    f.file = file.split("/").pop();
    if (existsSync(file)) { got++; continue; }
    // Wikimedia serves thumbnails at its standard widths only (960 is one); an original under 960 px is fetched whole
    const src = f.url.includes("upload.wikimedia.org") ? (f.w > 960 ? thumb(f.url) : f.url) : f.size && f.size > 4e6 ? null : f.url;
    if (!src) continue;
    const r = await fetch(src, { headers: UA });
    if (!r.ok) { f.file = null; continue; }
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    got++;
  }
  writeFileSync(`${dir}/list.json`, JSON.stringify(list, null, 1));
  console.log(`${species}: ${list.length} permissive, ${got} fetched`);
}
