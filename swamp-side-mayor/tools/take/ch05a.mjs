// 05 Point at it (1): the cut opened again at its plank version (the app's v2), the playhead taken to 0:58.5 on the
// ruler (wings spread over the keyboard); the floating tools.
import { cap, chapter, click, hover, key, move, node, pause, tap, tip, vis, d } from "./tk.mjs"
chapter("05")
await click("card-watch")
await node("versions")
await pause(2000)
const u = await d.ui()
for (const n of u.nodes) if (n.visible && /ruler|timeline|time|playhead|scrub|tool|comment|pin|note/i.test(n.id)) console.log("n", d.fmt(n))
