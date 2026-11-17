// The app's player with the film in it, one picture per frame: each app capture that holds a player (plan.ts SHOWN,
// `film`) with the film's frame for that moment pasted into its rect, as assets/app/played/BASE-FFFF.png. The screen
// shows these as one plane (machine.tsx); a second plane over the capture lost the draw order and showed black.
//   bun tools/played.ts            (then it runs magick for each new picture)
import { existsSync, mkdirSync } from "fs";
import { FPS, FRAMES, G, beatAt, playedBeat, shownAt } from "../compositions/plan";
const out = "assets/app/played"; mkdirSync(out, { recursive: true });
const want = new Map<string, { dir: string; base: string; film: number; rect: number[] }>();
for (let f = 0; f < FRAMES; f++) { const b = beatAt(f / FPS), s = shownAt(b); if (!s?.film) continue;
  for (const bb of [b, b + 0.5]) { const s2 = shownAt(bb); if (!s2?.film) continue; const film = Math.round(G(playedBeat(bb)) * 30), base = s2.img.replace("app/", ""), tag = s2.clay ? "-clay" : ""; want.set(`${base}${tag}-${String(film).padStart(4, "0")}`, { dir: s2.clay ? "clay" : "film", base, film, rect: s2.film }); } }
let made = 0;
for (const [name, w] of want) { const dst = `${out}/${name}.png`; if (existsSync(dst)) continue; const [x0, y0, x1, y1] = w.rect;
  const p = Bun.spawnSync(["magick", `assets/app/${w.base}.png`, "(", `assets/app/${w.dir}/f${String(w.film).padStart(4, "0")}.jpg`, "-resize", `${x1 - x0}x${y1 - y0}!`, ")", "-geometry", `+${x0}+${y0}`, "-composite", dst]);
  if (p.exitCode !== 0) throw new Error(`magick failed on ${name}: ${p.stderr}`); made++; }
console.log(`${want.size} pictures, ${made} made`);
