// v9 (7), the controllers chapter again in the clean project (130-140 from the first take showed the timeline edit's
// frame lists in the chat beside the rack): the Controllers tab; Delivery's Loudness knob turned up and slowly back;
// + (New controller), a line typed, Create, and the agent building Honks into the rack. The first take's Honks was
// moved out of the scratch workspace first, so it arrives new. Captures 130-140.
import { cap, chapter, click, down, go, gone, hover, mark, move, node, pause, tip, typeInto, up, vis, d } from "./tk.mjs"
chapter("v9-07")
const val = async () => vis(await d.ui(), "control-delivery.delivery.loudness")?.value
if (!vis(await d.ui(), "shell-tab-controllers")) { await click("project-p-new-mwjuq0jd1"); await node("shell-tab-controllers"); await pause(1500) }
if (!vis(await d.ui(), "controllers-page")) { await click("shell-tab-controllers"); await pause(1200) }
await gone("controller-honks", 20000)
await move(1300, 230, 3)
await pause(500)
await cap("130-rack", "The Controllers tab: one controller, Delivery: Loudness -14 LUFS, Captions on, Shape 18:9")
const k = await node("control-delivery.delivery.loudness-knob"), kx = k.rect.x + k.rect.w / 2, ky = k.rect.y + k.rect.h / 2
await move(kx, ky, 4)
await tip()
await cap("131-knob-hover", "Pointer on the Loudness knob")
await down()
for (let i = 1; i <= 8; i++) { await move(kx, ky - i * 15, 1); await pause(90) }
await pause(400)
console.log("up to", await val())
await cap("132-knob-up", "Held and turned: the knob round, the value up", { live: true })
for (let i = 9; i <= 12; i++) { await move(kx, ky - i * 15, 1); await pause(90) }
await pause(300)
console.log("further", await val())
await cap("133-knob-further", "Further, to the top", { live: true })
for (let i = 11; i >= 0; i--) { await move(kx, ky - i * 15, 1); await pause(160) }
await up()
await pause(800)
console.log("back", await val())
await move(1300, 420, 3)
await cap("134-knob-back", "Back to -14")
await hover("controllers-new", 0, { steps: 4 })
await tip()
await cap("135-new-controller-hover", "Pointer on + in the tab's bar: New controller")
await click("controllers-new")
await node("new-controller-text")
await pause(600)
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
const pd = (await d.ui()).nodes.find((n) => n.visible && /^pending-dismiss-/.test(n.id))
if (pd) { await click(pd.id); await pause(900) }
await move(1370, 650, 3)
await cap("140-honks-built", "Honks on the rack under Delivery: honks a minute, and Quiet, Loud or Goose")
console.log("loudness now", await val())
