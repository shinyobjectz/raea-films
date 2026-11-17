// The stand-in agent's turns for the take (no model; every step a real ACP update or a real call to the app's feed
// MCP server): routes.json picks a script by the prompt's words.
import { writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"
const A = "/tmp/goose-tut-take/agent", M = "/tmp/goose-tut-take/media"
mkdirSync(path.join(A, "go"), { recursive: true })
const say = (text) => ({ update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text } } })
const call = (id, tool, args, shown = args, title = tool) => [
  { update: { sessionUpdate: "tool_call", toolCallId: id, title, kind: "other", status: "in_progress", rawInput: shown } },
  { tool, args },
  { update: { sessionUpdate: "tool_call_update", toolCallId: id, status: "completed" } },
]
const TASKS = ["Build the swamp", "Animate Goose", "Cut it to the song", "Post the cut"]
const close = (t) => call(`tc-close-${t.split(" ")[0].toLowerCase()}`, "plan_close", { id: `$id:${t}` })
const DELIVERY = {
  id: "delivery", title: "Delivery", help: "How this project's films go out",
  groups: [{ id: "delivery", title: "Delivery", fields: [
    { id: "shape", label: "Shape", type: "choice", options: ["16:9", "18:9", "9:16"], value: "18:9" },
    { id: "loudness", label: "Loudness", type: "number", unit: "LUFS", value: -14, min: -24, max: -6, step: 1 },
    { id: "captions", label: "Captions", type: "toggle", value: true },
  ] }],
}
const HONKS = {
  id: "honks", title: "Honks", help: "How much Goose honks",
  groups: [{ id: "honks", title: "Honks", fields: [
    { id: "per-minute", label: "Honks a minute", type: "number", value: 6, min: 0, max: 60, step: 1 },
    { id: "volume", label: "Volume", type: "choice", options: ["Quiet", "Loud", "Goose"], value: "Goose" },
  ] }],
}
const job = [
  say("A music video: you, in a swamp, summoning ancient magic. I'll plan it first."),
  ...call("tc-plan", "plan_add", { tasks: TASKS.map((title) => ({ title })) }),
  { update: { sessionUpdate: "tool_call", toolCallId: "tc-build", title: "Building the swamp", kind: "execute", status: "in_progress", rawInput: { command: "raea render compositions/swamp.tsx -o out/swamp.png" } } },
  { mark: "running" },
  { gate: "build" },
  { update: { sessionUpdate: "tool_call_update", toolCallId: "tc-build", status: "completed" } },
  ...close(TASKS[0]),
  ...call("tc-delivery", "controller_write", { controller: DELIVERY }),
  { mark: "controller" },
  { gate: "stills" },
  ...call("tc-still-1", "feed_post", { type: "look", title: "The swamp, first light", file: `${M}/stills/goose-9.jpg` }),
  ...call("tc-still-2", "feed_post", { type: "look", title: "Goose in the mud", file: `${M}/stills/goose-31.jpg` }),
  ...call("tc-still-3", "feed_post", { type: "look", title: "The summoning", file: `${M}/stills/goose-47.jpg` }),
  ...close(TASKS[1]),
  { mark: "stills" },
  { gate: "cut" },
  ...call("tc-cut-v2", "feed_post", { type: "watch", title: "Swamp Goose", file: `${M}/goose-v2.mp4` }),
  { mark: "v2" },
  { gate: "v3" },
  ...call("tc-cut-v3", "feed_post", { type: "watch", title: "Swamp Goose", file: `${M}/goose-v3.mp4`, replaces: "$last", changed: "the summoning longer, more mud" }),
  ...close(TASKS[2]),
  ...close(TASKS[3]),
  { mark: "v3" },
  { gate: "reply" },
  say("Swamp Goose is in the feed, at version 3: the summoning runs longer, and there's more mud."),
  { mark: "done" },
]
const goal = [say("Got it: every shot has you in it. I'll check the cut shot by shot once v3 is up, and recut any you're missing from."), { mark: "goal" }, { gate: "goal-end" }]
const note = [
  ...call("tc-note-working", "comment_task", { item: "$item", comments: ["$comment"], state: "working" }),
  say("Taking your note on the wings."),
  ...call("tc-note-plan", "plan_add", { tasks: [{ title: "Draw the wings as wings: feathers, not planks", from: "$item#$comment" }] }),
  { mark: "note-planned" },
  { gate: "v4" },
  ...call("tc-cut-v4", "feed_post", { type: "watch", title: "Swamp Goose", file: `${M}/goose-v4.mp4`, replaces: "$item", answers: ["$comment"], changed: "drawn wings, not planks" }),
  ...call("tc-note-close", "plan_close", { id: "$id:Draw the wings as wings: feathers, not planks" }),
  { mark: "v4" },
  { gate: "note-reply" },
  say("Version 4 is in the feed: drawn wings, feathers and all."),
  { mark: "note-done" },
]
const edits = [say("Got your two edits: the opening shot without you is gone. I'll carry on from your cut."), { mark: "edits" }, { gate: "edits-end" }]
const controller = [
  say("A controller for Goose's honks: how many a minute, and how loud."),
  ...call("tc-honks", "controller_write", { controller: HONKS }),
  { mark: "honks" },
  { gate: "honks-end" },
  say("Honks is on the rack."),
]
const trailer = [say("Done.")]
const files = { "job.json": job, "goal.json": goal, "note.json": note, "edits.json": edits, "controller.json": controller }
for (const [f, steps] of Object.entries(files)) writeFileSync(path.join(A, f), JSON.stringify(steps, null, 1))
writeFileSync(path.join(A, "routes.json"), JSON.stringify([
  { match: "make me a music video", file: "job.json" },
  { match: "\\[raea /goal\\] The person set a goal", file: "goal.json" },
  { match: "planks", file: "note.json" },
  { match: "honk", file: "controller.json" },
  { match: "edit", file: "edits.json" },
], null, 1))
console.log("agent scripts written")
