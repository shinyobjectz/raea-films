// The demo world the app's captures are made on (the app's RAEA_DEMO, apps/app vite.config.ts demo()): a workspace with
// the Stay project, the film as a watch item twice (the film so far, comment 1 resolved; and with all six comments
// resolved), each comment from parts/plan.ts pinned where and when the cursor leaves it in the film.
//   bun tools/demo-world.ts DEMO_DIR FILM.mp4
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { COMMENTS, FRAMES, FPS } from "../parts/plan";
import { camAt } from "../parts/cams";
import { project } from "../parts/aim";

const [dir, film] = process.argv.slice(2);
if (!dir || !film) throw new Error("usage: bun tools/demo-world.ts DEMO_DIR FILM.mp4");
mkdirSync(`${dir}/media`, { recursive: true });
const name = film.split("/").pop()!;
const duration = FRAMES / FPS;
const when = (m: number) => new Date(Date.UTC(2026, 10, 11, 1, m)).toISOString();

/** where each comment sits on the film's frame: the cursor's point as the camera sees it at the click; comment 2's
 *  is on the canyon frame inside the app (the cursor pins it there), so its own frame's place and moment */
// v3 (11-11): each note sits on the place it is about, at a moment of the v3 film (the old film's cameras no longer place them)
const PIN: Record<number, { x: number; y: number; t: number }> = { 1: { x: 0.78, y: 0.42, t: 4.2 }, 2: { x: 0.3, y: 0.4, t: 13.6 }, 3: { x: 0.34, y: 0.62, t: 20.4 }, 4: { x: 0.6, y: 0.3, t: 40.4 }, 5: { x: 0.5, y: 0.45, t: 55.0 }, 6: { x: 0.52, y: 0.6, t: 66.8 } };
const pinOf = (c: (typeof COMMENTS)[number]) => {
  if (PIN[c.n]) return PIN[c.n];
  const q = project(camAt(c.click), c.at);
  return { x: Math.round(q.x * 1000) / 1000, y: Math.round(q.y * 1000) / 1000, t: c.click };
};
/** what the agent says it did on each, as the task's line (the build replaces these with a real run's) */
const DONE: Record<number, string> = {
  1: "Sun lowered and warmed through the kitchen window.",
  2: "Walls repainted deep green; the lamp dimmed.",
  3: "Three plants moved to the bench, two added.",
  4: "Sun brought down the slot; the walls warm with it.",
  5: "Rain on the panes; the sky greyed.",
  6: "Headlamps lit, their light on the deck.",
};
const comment = (c: (typeof COMMENTS)[number], version: string) => ({
  id: `cm-${c.n}`,
  text: c.text,
  author: { kind: "person", name: "You" },
  when: when(10 + c.n),
  pin: { kind: "place", ...pinOf(c) },
  kind: "edit",
  sent: `n-${c.n}`,
  resolved: true,
  task: { state: "done", by: "Kimi", at: when(11 + c.n), version, note: DONE[c.n] },
  replies: [],
});
const media = [{ library: "l-stay", path: name, kind: "video", storage: "local", raeaMade: true, aspect: 1.25 }];
const item = (id: string, minute: number, comments: unknown[], replaces?: string) => ({
  id, type: "watch", title: "Stay · the film", project: "p-stay", status: "seen", when: when(minute), duration,
  connection: "c-stay-kimi", about: [{ composition: "stay" }], notes: [], comments, media, component: { template: "review" },
  ...(replaces ? { replaces } : {}),
});
const world = {
  now: when(40),
  agents: [{ id: "a-kimi", name: "Kimi", hue: 5, role: "the film" }],
  connections: [{ id: "c-stay-kimi", agent: "a-kimi", project: "p-stay" }],
  libraries: [{ id: "l-stay", name: "Stay", storage: "local", files: [{ path: name, kind: "video", bytes: statSync(film).size }] }],
  projects: [{ id: "p-stay", name: "Stay", libraries: ["l-stay"], mark: { emoji: "🌅", hue: 2 } }],
  feeds: [{ id: "f-stay-all", project: "p-stay", name: "All" }],
  items: [
    item("i-stay-v7", 30, COMMENTS.map((c) => comment(c, "i-stay-v7")), "i-stay-v2"),
    item("i-stay-v2", 20, COMMENTS.filter((c) => c.n === 1).map((c) => comment(c, "i-stay-v2"))),
  ],
};
writeFileSync(`${dir}/world.json`, JSON.stringify(world, null, 2));
writeFileSync(`${dir}/workspace.json`, JSON.stringify({ name: "Studio", mark: { emoji: "🎬", hue: 3 } }));
console.log(`${dir}/world.json: ${world.items.length} items, ${COMMENTS.length} comments, ${name} (${duration.toFixed(2)} s)`);
