// 06 Fix it yourself (4): Back to the chat: the sent edit and the agent's reply.
import { cap, chapter, key, move, pause, d } from "./tk.mjs"
chapter("06")
await key("Escape")
await pause(1500)
await move(700, 560, 3)
await cap("128-edit-reply", "Back in the chat: the edit as sent, and the agent's reply: the frog's shot is gone")
