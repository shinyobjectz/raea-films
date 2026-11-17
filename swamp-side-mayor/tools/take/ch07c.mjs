// 07 (3): the pending card's error dismissed (the stand-in wrote the controller, but not as New controller's request
// expects), so the rack shows Delivery and Honks.
import { cap, chapter, click, move, pause } from "./tk.mjs"
chapter("07")
await click("pending-dismiss-1")
await pause(900)
await move(1370, 650, 3)
await cap("140-honks-built", "Honks on the rack under Delivery: honks a minute, and Quiet, Loud or Goose")
