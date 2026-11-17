// Plays the session (a person at the title screen, then the Bot at the keys and mouse) and records only what their
// devices did, frame by frame, into game/run.gen.json: the game reads it back as input. Also writes out/run.marks.json
// (where each beat fell, in session seconds).
//   bun tools/record.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { simulate } from "../game/playthrough";
import { menuInputs } from "../game/session";
import { FPS } from "../game/step";

const BITS = ["w", "a", "s", "d", "Shift"];
const menu = menuInputs();
const { bot, states } = simulate();
const all = [...menu, ...bot.inputs];
const inputs = all.map((i) => [BITS.reduce((m, k, b) => m | (i.keys.includes(k) ? 1 << b : 0), 0), i.dx, i.dy, i.down ? 1 : 0]);
const out = { frames: inputs.length + 1, bits: BITS, menu: menu.length, inputs };
writeFileSync(new URL("../game/run.gen.json", import.meta.url), JSON.stringify(out));
mkdirSync(new URL("../out", import.meta.url), { recursive: true });
const marks = [{ f: 0, name: "menu" }, ...bot.marks.map((m) => ({ ...m, f: m.f + menu.length }))];
writeFileSync(new URL("../out/run.marks.json", import.meta.url), JSON.stringify(marks.map((m) => ({ ...m, t: +(m.f / FPS).toFixed(2) })), null, 1));
console.log(`recorded ${inputs.length} frames (${(inputs.length / FPS).toFixed(1)} s): menu ${(menu.length / FPS).toFixed(1)} s, game ${(bot.inputs.length / FPS).toFixed(1)} s; last state f=${states[states.length - 1].f}`);
for (const m of marks) console.log(`  ${(m.f / FPS).toFixed(1).padStart(6)}  ${m.name}`);
console.log(`stuck: ${JSON.stringify(bot.stuck ?? [])}`);
