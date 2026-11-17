// Lists the score's samples for the composition (it can't read a folder): each pitched library instrument's notes,
// and each sound effect's takes. Run: bun tools/sounds.ts   (writes parts/sounds.gen.json)
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const M = path.join(ROOT, "media");
const files = (dir: string) => readdirSync(path.join(M, dir)).filter((f) => /\.(wav|mp3)$/.test(f)).sort();

const PITCHED: Record<string, string> = {
  celesta: "sounds/fluid-celesta",
  pizz: "sounds/fluid-pizzicato_strings",
  bass: "sounds/fluid-acoustic_bass",
  strings: "sounds/fluid-string_ensemble_1",
  piano: "sounds/vcsl-upright-piano-knight",
  marimba: "sounds/vcsl-marimba",
  glock: "sounds/vcsl-glockenspiel",
  clarinet: "sounds/tonejs-instruments-clarinet",
  bassoon: "sounds/tonejs-instruments-bassoon",
};
const instruments: Record<string, Record<string, string>> = {};
for (const [name, dir] of Object.entries(PITCHED)) {
  instruments[name] = {};
  for (const f of files(dir)) {
    const m = /^([A-G])(s|#|b)?(-?\d)\./.exec(f);
    if (!m) continue;
    instruments[name][`${m[1]}${m[2] === "s" || m[2] === "#" ? "#" : m[2] ?? ""}${m[3]}`] = `${dir}/${f}`;
  }
}

// sound effects: SAO takes (trimmed, media/sfx/cut) and recorded CC0 percussion (VCSL)
const take = (prefix: string) => files("sfx/cut").filter((f) => f.startsWith(prefix + "-")).map((f) => `sfx/cut/${f}`);
const lib = (dir: string, re: RegExp, n = 3) => files(dir).filter((f) => re.test(f)).slice(0, n).map((f) => `${dir}/${f}`);
const hits: Record<string, string[]> = {
  pencil: take("pencil-scratch"),
  "pencil-circle": take("pencil-circle"),
  slap: take("paper-slap"),
  slide: take("paper-slide"),
  snip: take("snip"),
  stamp: take("stamp"),
  key: take("key"),
  ding: take("ding"),
  shutter: take("shutter"),
  "tape-rip": take("tape-rip"),
  "tape-pat": take("tape-pat"),
  knob: take("knob"),
  pin: take("pin"),
  lid: take("lid"),
  lock: take("lock"),
  copier: take("copier"),
  string: take("string-pull"),
  wood: lib("sounds/vcsl-woodblock", /wood_click_(mp|pp)/),
  shaker: lib("sounds/vcsl-shaker-small", /Shaker(Double)?_(Up|Down)|Shaker_Slap/),
  cabasa: lib("sounds/vcsl-cabasa", /Hit/),
  kick: lib("sounds/vcsl-bass-drum-2", /hit_(mp|mf)/),
  marktrees: lib("sounds/vcsl-mark-trees", /fastAsc|slowAsc/, 2),
  triangle: lib("sounds/vcsl-triangles", /hit_mp_pt|hit_mf/),
  fingercym: lib("sounds/vcsl-finger-cymbals", /Fing/),
  handbell: lib("sounds/vcsl-hand-bells-nepalese", /HB_/),
  ratchet: lib("sounds/vcsl-ratchet", /Crank/),
  slitlo: lib("sounds/vcsl-slit-drum", /LogDrumLo/),
  slithi: lib("sounds/vcsl-slit-drum", /LogDrumHi/),
};
for (const [k, v] of Object.entries(hits)) if (!v.length) throw new Error(`no takes for ${k}`);

// every take peak-normalised to -1 dBFS in media/kit, so the score's levels are its own and not each recording's
// (VCSL's percussion was recorded 12 to 40 dB under full scale; the SAO takes come normalised)
mkdirSync(path.join(M, "kit"), { recursive: true });
const peakOf = (file: string) => {
  const r = spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const m = /max_volume: (-?[\d.]+) dB/.exec(r.stderr);
  if (!m) throw new Error(`no peak for ${file}`);
  return Number(m[1]);
};
for (const [k, v] of Object.entries(hits)) {
  hits[k] = v.map((rel, i) => {
    const out = `kit/${k}-${i + 1}.wav`;
    const gain = -1 - peakOf(path.join(M, rel));
    execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", path.join(M, rel), "-af", `volume=${gain.toFixed(2)}dB`, "-ar", "48000", path.join(M, out)]);
    return out;
  });
}
writeFileSync(path.join(ROOT, "parts/sounds.gen.json"), JSON.stringify({ instruments, hits }, null, 1));
console.log(Object.entries(instruments).map(([k, v]) => `${k} ${Object.keys(v).length}`).join(", "));
console.log(Object.entries(hits).map(([k, v]) => `${k} ${v.length}`).join(", "));
