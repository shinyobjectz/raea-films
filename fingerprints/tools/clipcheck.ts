// "No clipping", as numbers: for every other frame of the film, how far the hand's lowest skin is above the desk
// (y = 0), by shot, and how deep a held tool's point goes into the sheet. A negative clearance is skin in the desk.
// The grip itself is fitted to the skin (tools/fitgrip.ts: the pads give 2.4 mm at most round the pencil), and holds its shape in every shot.
// Usage: bun tools/clipcheck.ts
import { act } from "../v2/act";
import { STICK } from "../v2/poses";
import { apply, boneAt, lowest } from "../v2/rig";
import { DURATION, FPS } from "../v2/time";
const by: Record<string, { low: number; at: number; tip: number }> = {};
for (let f = 0; f < DURATION; f += 2) {
  const s = act(f / FPS);
  if (!s.pose) continue;
  const low = lowest(s.pose);
  const tip = s.tool && s.tool !== "baton" ? apply(boneAt("hand", s.pose), STICK.tip)[1] : 9;
  const b = (by[s.shot] ??= { low: 9, at: 0, tip: 9 });
  if (low < b.low) { b.low = low; b.at = f; }
  if (tip < b.tip) b.tip = tip;
}
let bad = 0;
for (const [shot, b] of Object.entries(by)) {
  const mm = (b.low * 100).toFixed(1); // a unit is 10 cm of the real hand
  if (b.low < -0.001) bad++;
  console.log(`${shot.padEnd(9)} skin ${mm.padStart(6)} mm above the desk at its lowest (frame ${b.at})${b.tip < 9 ? `, the tool's point ${(b.tip * 100).toFixed(1)} mm` : ""}${b.low < -0.001 ? "   <-- in the desk" : ""}`);
}
console.log(bad ? `${bad} shot(s) clip` : "no shot puts skin in the desk");
