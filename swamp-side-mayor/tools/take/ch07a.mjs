// 07 Settings every agent reads (1): the Controllers tab's rack, Delivery (Shape 18:9, Loudness -14 LUFS, Captions);
// the Loudness knob pecked and dragged round to the top, then slowly back to -14.
import { cap, chapter, down, hover, move, pause, tip, up, vis, d } from "./tk.mjs"
chapter("07")
const val = async () => vis(await d.ui(), "control-delivery.delivery.loudness")?.value
const lamp = async () => d.fmt(vis(await d.ui(), "controller-lamp-delivery"))
await move(1300, 230, 3)
await pause(500)
await cap("130-rack", "The Controllers tab: the rack, one module, Delivery: Loudness -14 LUFS, Captions on, Shape 18:9")
await move(1234, 180, 4)
await tip()
await cap("131-knob-hover", "Pointer on the Loudness knob")
await down()
for (let i = 1; i <= 8; i++) { await move(1234, 180 - i * 15, 1); await pause(90) }
await pause(400)
console.log("up to", await val(), await lamp())
await cap("132-knob-up", "Held and turned: the knob round to the top, the value up", { live: true })
for (let i = 9; i <= 12; i++) { await move(1234, 180 - i * 15, 1); await pause(90) }
await pause(300)
console.log("further", await val())
await cap("133-knob-further", "Further", { live: true })
for (let i = 11; i >= 0; i--) { await move(1234, 180 - i * 15, 1); await pause(160) }
await up()
await pause(800)
console.log("back", await val(), await lamp())
await move(1300, 420, 3)
await cap("134-knob-back", "Back to -14")
