// The people around a camera for a day, from people/city.ts (the baked tiles' doors, people/roles.ts): prints who is
// near, middle and far, how many are out of doors in the camera's tile against world/budgets.ts's PEOPLE_PER_TILE,
// the busiest queues and the census by hour.
//   bun --tsconfig-override ~/raea/sdk/tsconfig.base.json tools/people/city.ts [DATE] [HH:MM] [E N] [PER_DOOR]
// (PER_DOOR: a fixed number of residents a house door; unless said, each door's own, from its floor area)
import { census, snapshot, type V3 } from "raea/people";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cityAround, passersAround, placeSource } from "../../people/city.ts";
import { PEOPLE_PER_TILE, PEOPLE_RANGE } from "../../world/budgets.ts";

const G = join(import.meta.dir, "../..");
const DATE = process.argv[2] ?? "1917-12-03";
const clock = process.argv[3] ?? "17:30", [hh, mm] = clock.split(":").map(Number);
// Leipziger Straße at the Wertheim block unless said (EPSG:25833)
const E = Number(process.argv[4] ?? 390700), N = Number(process.argv[5] ?? 5818975), per = Number(process.argv[6] ?? 0);
const cam: V3 = [E - 391000, 34, -(N - 5819000)];

const t0 = performance.now();
const day = cityAround({ eye: cam, date: DATE, perDoor: per });
const ms = performance.now() - t0;
const t1 = performance.now();
const now = snapshot(day, hh * 60 + mm, cam, PEOPLE_RANGE);
const snapMs = performance.now() - t1;
const lv = { near: 0, middle: 0, far: 0, inside: 0 };
for (const s of now) lv[s.level]++;
// out of doors within the camera's 250 m tile
const tile = now.filter((s) => s.level !== "inside" && Math.abs(s.at[0] - cam[0]) <= 125 && Math.abs(s.at[2] - cam[2]) <= 125);
const moving = tile.filter((s) => s.activity.kind === "trip").length;
console.log(`city: ${day.people.length} people living within 1200 m of the camera, ${day.places.size} places, ${DATE} at ${clock}; days in ${ms.toFixed(0)} ms, a snapshot in ${snapMs.toFixed(1)} ms`);
console.log(`city: near ${lv.near}, middle ${lv.middle}, far ${lv.far}, inside ${lv.inside}`);
console.log(`city: out of doors in the camera's tile: ${tile.length} (${moving} on the move), budget ${PEOPLE_PER_TILE.mainAvenue} on a main avenue`);
const queues = new Map<string, number>();
for (const x of now) if (x.activity.kind === "stay" && x.activity.outside) queues.set(x.activity.at, (queues.get(x.activity.at) ?? 0) + 1);
console.log(`city: queues and posts: ${[...queues].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} (${placeSource(k)}) ${v}`).join(", ") || "none"}`);
// the street's own walkers within 250 m at the clock, by role (drawn by who the days put on foot then)
const walkers = passersAround(cam, hh * 60 + mm, 250, 1, 0.8, DATE), byRole = new Map<string, number>();
for (const w of walkers) byRole.set(w.person.role, (byRole.get(w.person.role) ?? 0) + 1);
console.log(`city: ${walkers.length} walking the sidewalks within 250 m: ${[...byRole].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")}`);
const c = census(day);
const pick = ["home", "bakery", "butcher", "works", "moving:walk", "moving:tram", "school", "beat-corner", "guard-post", "hinterhof"];
console.log("hour  " + pick.map((k) => k.padStart(12)).join(""));
for (const h of [5, 6, 7, 9, 12, 15, 17, 18, 20, 23]) console.log(`${String(h).padStart(2, "0")}:30 ` + pick.map((k) => String(c.get(k)?.[h] ?? 0).padStart(12)).join(""));
mkdirSync(join(G, "out/people"), { recursive: true });
const sample = day.people.filter((_, i) => i % Math.ceil(day.people.length / 12) === 0).map((p) => ({ ...p, day: day.days.get(p.id) }));
writeFileSync(join(G, "out/people/city-sample.json"), JSON.stringify(sample, null, 1));
