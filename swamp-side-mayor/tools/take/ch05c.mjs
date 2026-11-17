// 05 Point at it (3): the note typed on the plank wing, Edit (sends to the agent) left on, the note in the notes rail.
import { cap, chapter, click, hover, key, move, node, pause, tip, typeInto, vis, d } from "./tk.mjs"
chapter("05")
await typeInto("inline-input", "my wings look like planks", { every: 18, name: "105-note", about: "The note typed in the box on the wing" })
await pause(400)
await hover("inline-kind-edit", 0, { steps: 3 })
await tip()
await cap("106-edit-kind", "Edit | Note under the box, Edit on: it goes to the agent")
const u = await d.ui()
for (const n of u.nodes) if (n.visible && /inline|note|notes|send|rail/i.test(n.id + " " + (n.name ?? ""))) console.log("n", d.fmt(n))
