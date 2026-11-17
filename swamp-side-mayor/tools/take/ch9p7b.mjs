// v9 (7b): the stand-in's "finished without writing it" card (its controller_write isn't the reply New controller
// waits for) dismissed once it shows, then Honks on the rack again. Capture 140.
import { cap, chapter, click, move, pause, d } from "./tk.mjs"
chapter("v9-07")
const pd = await d.wait("the pending card", async () => (await d.ui()).nodes.find((n) => n.visible && /^pending-dismiss-/.test(n.id)), 20000)
await click(pd.id)
await pause(900)
await move(1370, 650, 3)
await cap("140-honks-built", "Honks on the rack under Delivery: honks a minute, and Quiet, Loud or Goose")
