// 05, between ch05a and ch05b: the playhead taken to 0:58.5 by a tap on the ruler (00:00 at x 207, 15.17 px a second
// at the take's 1600 x 900), the pointer moved off, and the time read back.
import { tap, move, pause, d } from "./tk.mjs"
await tap(1095, 816, "timeline-ruler")
await pause(1500)
await move(700, 740, 2)
await pause(800)
const u = await d.ui()
for (const n of u.nodes) if (n.visible && /timeline-time|timeline-playhead/.test(n.id)) console.log(d.fmt(n), JSON.stringify(n.text ?? n.value ?? ""))
await d.png("/tmp/goose-tut-take/out/at058.png")
