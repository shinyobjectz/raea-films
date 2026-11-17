// v9 (4), the fresh Swamp Goose project, its job let go a step at a time (world9.mjs's gates) and captured as each
// lands: the plan and Building the swamp; built; each still into the feed; Animating Goose; Cutting it to the song; the
// cut; its next version in place; the reply; the goal's turn and its check. Captures 200-211.
import { cap, chapter, go, mark, move, pause, d } from "./tk.mjs"
chapter("v9-04")
const cards = async () => (await d.ui()).nodes.filter((n) => n.visible && /^card-i-/.test(n.id)).map((n) => d.fmt(n))
const step = async (gate, waitFor, name, about, settle = 1500) => {
  go(gate); await mark(waitFor, 90000); await pause(settle)
  await cap(name, about); console.log("  cards:", (await cards()).join(" | "))
}
await move(1060, 560, 3)
await pause(800)
await cap("200-rt-plan", "The agent's plan in the chat, Building the swamp running; the goal set over the box; the feed empty")
await step("build", "controller", "201-rt-built", "Building the swamp done; the plan's first task closed; Delivery written")
await step("s1", "s1", "202-rt-still1", "The first still lands in the feed: The swamp, first light")
await step("anim", "anim", "203-rt-anim", "Animating Goose running in the chat", 900)
await step("s2", "s2", "204-rt-still2", "The second still lands: Goose in the mud")
await step("s3", "stills", "205-rt-still3", "The third still lands: The summoning; Animating Goose done")
await step("cutting", "cutting", "206-rt-cutting", "Cutting it to the song, running", 900)
await step("cut", "v2", "207-rt-cut", "The cut lands at the top of the feed: Swamp Goose", 3000)
await step("v3", "v3", "208-rt-v2", "Its next version replaces it on the same card: v2, the summoning longer", 3000)
await step("reply", "done", "209-rt-reply", "The agent's reply; its job done", 2000)
await mark("goal", 90000).catch((e) => console.log("no goal turn:", e.message))
await pause(1500)
await cap("210-rt-goal-working", "The goal's own turn: checking the cut against it")
go("goal-end")
await pause(6000)
await cap("211-rt-goal-met", "The goal checked and met")
console.log("  cards:", (await cards()).join(" | "))
await d.png("/tmp/goose-tut-take/out/rt.png")
