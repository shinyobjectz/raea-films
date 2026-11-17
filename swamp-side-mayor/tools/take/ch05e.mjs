// 05 Point at it (5): the pin hovered, Send (the floating "Send 1") pressed: the note goes to the agent, which takes
// it as a task; the chat with the note; then the panel's Tasks tab, the task linked to the note.
import { cap, chapter, click, hover, key, mark, move, node, pause, tap, tip, vis, d } from "./tk.mjs"
chapter("05")
await move(496, 417, 4)
await tip()
await cap("108-pin-hover", "Pointer on the pin on the wing")
await move(1194, 730, 4)
await pause(500)
await cap("109-send-hover", "Pointer on Send (1 note waiting)")
await tap(1194, 730, "send-notes")
await mark("note-planned", 60000)
await pause(2500)
await move(700, 500, 3)
await cap("110-note-sent", "Sent: the note in the chat, the agent taking it, its task made")
const u = await d.ui()
for (const n of u.nodes) if (n.visible && /tab|task|plan|turn-|note|shell-panel/i.test(n.id)) console.log("n", d.fmt(n))
