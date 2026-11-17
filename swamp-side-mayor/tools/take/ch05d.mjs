// 05 Point at it (4): the note posted (Enter), the notes rail open: the note under its anchor chip, Edit | Note.
import { cap, chapter, click, hover, key, move, node, pause, tip, vis, d } from "./tk.mjs"
chapter("05")
await key("Enter")
await pause(1200)
let u = await d.ui()
if (!u.nodes.some((n) => n.visible && /^notes-rail|^notes-panel|^note-/.test(n.id))) { await click("notes-toggle"); await pause(900) }
await move(1250, 300, 3)
await pause(500)
await cap("107-notes-rail", "The notes rail: the note under its anchor chip (0:58), Edit | Note above it, Edit on")
u = await d.ui()
for (const n of u.nodes) if (n.visible && n.rect.x > 1000 && n.rect.y < 880) console.log("n", d.fmt(n))
