// v9's stand-in answer to the planks note (the director, 11-16: "that giant wall of text does not look good"). The app shows a
// sent note's whole handoff (the note, then what the agent's asked to do with it) as the person's turn, so the agent's
// work after it is told the way a real run tells it, a line and a step at a time, with the wings' still posted to the
// feed before the cut. By gate "tasks" the handoff has scrolled up out of the chat, so the panel's Tasks and the feed
// can be captured with the chat beside them holding only the agent's own turns.
import { writeFileSync } from "node:fs"
const A = "/tmp/goose-tut-take/agent", M = "/tmp/goose-tut-take/media"
const say = (text) => ({ update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text } } })
const call = (id, tool, args, shown = args, title = tool) => [
  { update: { sessionUpdate: "tool_call", toolCallId: id, title, kind: "other", status: "in_progress", rawInput: shown } },
  { tool, args },
  { update: { sessionUpdate: "tool_call_update", toolCallId: id, status: "completed" } },
]
const step = (id, title, command) => ({ update: { sessionUpdate: "tool_call", toolCallId: id, title, kind: "execute", status: "in_progress", rawInput: { command } } })
const done = (id) => ({ update: { sessionUpdate: "tool_call_update", toolCallId: id, status: "completed" } })
const TASK = "Draw the wings as wings: feathers, not planks"
const note = [
  ...call("tc-note-working", "comment_task", { item: "$item", comments: ["$comment"], state: "working" }),
  say("Taking your note on the wings."),
  ...call("tc-note-plan", "plan_add", { tasks: [{ title: TASK, from: "$item#$comment" }] }),
  { mark: "note-planned" },
  { gate: "n1" },
  say("They look like planks because each wing is a flat box. I'll give them a curved edge and feathers along it."),
  step("tc-n-read", "Reading Goose's wings", "rg -n wing components/goose.tsx"),
  done("tc-n-read"),
  say("Found them: one flat box per wing."),
  step("tc-n-shape", "Drawing the wings", "raea blender run blender/goose_wings.py"),
  done("tc-n-shape"),
  say("Now the feathers, along each wing's edge."),
  step("tc-n-feathers", "Drawing the feathers", "raea blender run blender/goose_feathers.py"),
  done("tc-n-feathers"),
  { mark: "n1" },
  { gate: "n2" },
  say("Drawn. Rendering 0:58 to check them."),
  step("tc-n-still", "Rendering the shot at 0:58", "raea render compositions/film.tsx --at 58.5 -o out/"),
  done("tc-n-still"),
  ...call("tc-n-look", "feed_post", { type: "look", title: "The wings, drawn", file: `${M}/stills/wings-58.jpg` }),
  { mark: "n2" },
  { gate: "n3" },
  say("They read as wings now. Checking the frame against your note."),
  step("tc-n-check", "Checking 0:58", "raea check out/film-58_5.png"),
  done("tc-n-check"),
  say("The check passes. Rendering the whole cut."),
  step("tc-n-cut", "Rendering version 3", "raea render compositions/film.tsx -o out/swamp-goose-v3.mp4"),
  { mark: "n3" },
  { gate: "v4" },
  done("tc-n-cut"),
  ...call("tc-cut-v4", "feed_post", { type: "watch", title: "Swamp Goose", file: `${M}/goose-v3.mp4`, replaces: "$item", answers: ["$comment"], changed: "drawn wings, not planks" }),
  ...call("tc-note-close", "plan_close", { id: `$id:${TASK}` }),
  { mark: "v4" },
  { gate: "note-reply" },
  say("Version 3 is in the feed: drawn wings, feathers and all."),
  { mark: "note-done" },
]
writeFileSync(`${A}/note.json`, JSON.stringify(note, null, 1))
console.log("note route written:", note.filter((s) => s.gate).map((s) => s.gate).join(" "))
