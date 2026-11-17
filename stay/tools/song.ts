// The song's map (raea song media/music/NAME.wav -o media/music/NAME.song.json) and its kicks (tools/kicks.sh NAME) as
// a module the film imports: its beats, each beat's energy and low end, and its events. Run again after mapping the
// song again: cd tools && bun song.ts [NAME] (the film is Stay)
import { readFileSync, writeFileSync } from "node:fs";
const DIR = `${import.meta.dir}/..`;
const NAME = process.argv[2] ?? "stay";
const m = JSON.parse(readFileSync(`${DIR}/media/music/${NAME}.song.json`, "utf8"));
const r = (x: number) => Math.round(x * 1000) / 1000;
const ev = (k: string) => m.events.filter((e: { kind: string }) => e.kind === k).map((e: { time: number; end?: number }) => (e.end !== undefined ? [r(e.time), r(e.end)] : r(e.time)));
const kicks = JSON.parse(readFileSync(`${DIR}/media/music/${NAME}.kicks.json`, "utf8"));
const out = `// Written by tools/song.ts from media/music/${NAME}.song.json (raea song's map of the director's song): don't edit.
export const SONG = { file: "music/${NAME}.wav", seconds: ${r(m.duration)}, tempo: ${m.tempo} } as const;
/** each beat's time, seconds */
export const BEATS: number[] = ${JSON.stringify(m.beats.map(r))};
/** each beat's energy and low end, 0..1 */
export const ENERGY: number[] = ${JSON.stringify(m.features.energy)};
export const LOW: number[] = ${JSON.stringify(m.features.low)};
export const DROPS: number[] = ${JSON.stringify(ev("drop"))};
export const HITS: number[] = ${JSON.stringify(ev("hit"))};
/** [from, to] */
export const STOPS: [number, number][] = ${JSON.stringify(ev("stop"))};
export const DIPS: [number, number][] = ${JSON.stringify(ev("dip"))};
/** where its kick lands (tools/kicks.sh: its low end's jumps) */
export const KICKS: number[] = ${JSON.stringify(kicks)};
/** the downbeats raea song found (its bars, which a song with rubato doesn't keep evenly) */
export const DOWNBEATS: number[] = ${JSON.stringify((m.downbeats ?? []).map(r))};
export const SECTIONS: { name: string; from: number }[] = ${JSON.stringify(m.sections.map((s: { label?: string; name?: string; time?: number; start?: number }) => ({ name: s.label ?? s.name, from: r(s.time ?? s.start ?? 0) })))};
`;
writeFileSync(`${DIR}/parts/song.gen.ts`, out);
console.log(`wrote parts/song.gen.ts: ${m.beats.length} beats at ${m.tempo} bpm, ${m.duration} s`);
