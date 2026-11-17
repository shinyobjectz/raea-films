import { cap, chapter, click, move, d, pause } from "./tk.mjs"
chapter("02")
// what follows Downloading, once it's done (or a minute on)
const t0 = Date.now()
await d.wait("the download's end", async () => { const u = await d.ui(); return !u.nodes.some((n) => n.visible && /Downloading/.test(n.text ?? n.name ?? "")) || Date.now() - t0 > 60000 }, 70000).catch(() => {})
await move(1400, 560, 2)
await cap("042-claude-after-connect", "Claude's side panel after Connect, once its download settles: what a Mac without Claude signed in shows")
