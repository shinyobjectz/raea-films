// 06 Fix it yourself (3): "Send 1 edit" in the timeline's bar pecked: the edit goes to the agent as done; its reply.
import { cap, chapter, click, go, hover, mark, move, pause, tip, d } from "./tk.mjs"
chapter("06")
await hover("tl-send", 0, { steps: 4 })
await tip()
await cap("126-send-edit-hover", "Pointer on \"Send 1 edit\" in the timeline's bar")
await click("tl-send")
await mark("edits", 60000)
await pause(2200)
await move(700, 520, 3)
await cap("127-edit-sent", "The edit in the chat, the agent carrying on from the cut")
go("edits-end")
await pause(2500)
await cap("128-edit-reply", "The agent's reply: the frog's shot is gone")
