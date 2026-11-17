// Plays the run through the game's own step and prints where each beat landed, plus any stall.
import { simulate } from "../game/playthrough";
import { FPS } from "../game/step";
const t0 = performance.now();
const { bot, states } = simulate();
const last = states[states.length - 1];
console.log(`frames ${states.length - 1} (${((states.length - 1) / FPS).toFixed(1)} s) in ${(performance.now() - t0).toFixed(0)} ms`);
for (const m of bot.marks) { const s = states[m.f]; console.log(`${(m.f / FPS).toFixed(1).padStart(6)} s  ${m.name.padEnd(14)} at (${s.p.x.toFixed(2)}, ${s.p.z.toFixed(2)}) yaw ${s.p.yaw.toFixed(2)} sleep ${s.sleep.toFixed(2)}`); }
console.log("stuck", bot.stuck.map((f) => (f / FPS).toFixed(1)).join(" "));
console.log("story", JSON.stringify(last.st));
