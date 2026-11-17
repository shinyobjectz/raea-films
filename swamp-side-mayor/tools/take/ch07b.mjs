// 07 Settings every agent reads (2): New controller's dialog, a line typed (how much Goose honks), Create; the agent
// builds the Honks module into the rack.
import { cap, chapter, click, go, hover, mark, move, pause, tip, typeInto, d } from "./tk.mjs"
chapter("07")
await move(800, 250, 2)
await cap("136-new-controller", "New controller: describe what it should decide, in a sentence")
await typeInto("new-controller-text", "how much Goose honks: honks a minute, and how loud", { every: 25, name: "137-new-controller", about: "The line typed" })
await hover("new-controller-send", 0, { steps: 3 })
await cap("138-create-hover", "Pointer on Create")
await click("new-controller-send")
await mark("honks", 60000)
await pause(2500)
await move(1370, 500, 3)
await cap("139-honks-building", "The agent building it: Honks lands in the rack under Delivery")
go("honks-end")
await pause(2500)
await cap("140-honks-built", "Honks on the rack: honks a minute, how loud")
const u = await d.ui()
for (const n of u.nodes) if (n.visible && /controller-|field-honks|control-honks/.test(n.id)) console.log("n", d.fmt(n))
