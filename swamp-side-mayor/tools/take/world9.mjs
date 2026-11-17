// v9's stand-in job (the director on v8, a note: "I want to see it show up on feed and feel like we are watching it work
// in realtime"): world.mjs's job with a gate before every step and every card, so the take captures each as it lands:
// the plan, Building the swamp, each still, Animating Goose, Cutting it to the song, the cut, its next version, the reply.
// The other routes (goal, note, controller, edits) as the last take left them in agent/. The files are the ones that
// take posted (media/goose-v1..v3.mp4, the plank versions, restored from the app's own copies; stills/planks-*.jpg).
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
const A = "/tmp/goose-tut-take/agent", M = "/tmp/goose-tut-take/media"
const say = (text) => ({ update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text } } })
const call = (id, tool, args, shown = args, title = tool) => [
  { update: { sessionUpdate: "tool_call", toolCallId: id, title, kind: "other", status: "in_progress", rawInput: shown } },
  { tool, args },
  { update: { sessionUpdate: "tool_call_update", toolCallId: id, status: "completed" } },
]
const step = (id, title, command) => ({ update: { sessionUpdate: "tool_call", toolCallId: id, title, kind: "execute", status: "in_progress", rawInput: { command } } })
const done = (id) => ({ update: { sessionUpdate: "tool_call_update", toolCallId: id, status: "completed" } })
const TASKS = ["Build the swamp", "Animate Goose", "Cut it to the song", "Post the cut"]
const close = (t) => call(`tc-close-${t.split(" ")[0].toLowerCase()}`, "plan_close", { id: `$id:${t}` })
const old = JSON.parse(readFileSync("/tmp/goose-tut-snap-v8end/agent/job.json", "utf8"))
const DELIVERY = old.find((s) => s.tool === "controller_write").args.controller
const job = [
  say("A music video: you, in a swamp, summoning ancient magic. I'll plan it first."),
  ...call("tc-plan", "plan_add", { tasks: TASKS.map((title) => ({ title })) }),
  step("tc-build", "Building the swamp", "raea render compositions/swamp.tsx -o out/swamp.png"),
  { mark: "running" },
  { gate: "build" },
  done("tc-build"),
  ...close(TASKS[0]),
  ...call("tc-delivery", "controller_write", { controller: DELIVERY }),
  { mark: "controller" },
  { gate: "s1" },
  ...call("tc-still-1", "feed_post", { type: "look", title: "The title card", file: `${M}/stills/planks-7.jpg` }),
  { mark: "s1" },
  { gate: "anim" },
  step("tc-anim", "Animating Goose", "raea render compositions/goose.tsx --at 31,47 -o out/"),
  { mark: "anim" },
  { gate: "s2" },
  ...call("tc-still-2", "feed_post", { type: "look", title: "Goose in the mud", file: `${M}/stills/planks-31.jpg` }),
  { mark: "s2" },
  { gate: "s3" },
  ...call("tc-still-3", "feed_post", { type: "look", title: "The summoning", file: `${M}/stills/planks-15_5.jpg` }),
  done("tc-anim"),
  ...close(TASKS[1]),
  { mark: "stills" },
  { gate: "cutting" },
  step("tc-cut", "Cutting it to the song", "raea render compositions/film.tsx -o out/swamp-goose.mp4"),
  { mark: "cutting" },
  { gate: "cut" },
  done("tc-cut"),
  ...call("tc-cut-v2", "feed_post", { type: "watch", title: "Swamp Goose", file: `${M}/goose-v1.mp4` }),
  { mark: "v2" },
  { gate: "v3" },
  ...call("tc-cut-v3", "feed_post", { type: "watch", title: "Swamp Goose", file: `${M}/goose-v2.mp4`, replaces: "$last", changed: "the summoning longer" }),
  ...close(TASKS[2]),
  ...close(TASKS[3]),
  { mark: "v3" },
  { gate: "reply" },
  say("Swamp Goose is in the feed, at version 2: the summoning runs longer."),
  { mark: "done" },
]
writeFileSync(path.join(A, "job.json"), JSON.stringify(job, null, 1))
console.log("v9 job written:", job.filter((s) => s.gate).map((s) => s.gate).join(" "))
