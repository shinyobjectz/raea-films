#!/usr/bin/env node
// A scripted stand-in ACP agent for the app take (the fixture; no model is called, nothing leaves this Mac).
//   node agent.mjs DIR
// It answers raea's handshake with "ready". Any other prompt runs the script in DIR/script.json: a list of steps, each
// {update} (an ACP session/update, sent as is), {tool, args} (a call to the feed's MCP server that session/new named,
// started as the app's own agents start it) or {gate: NAME} (wait until DIR/go/NAME exists, so the take can capture
// each state) or {mark: NAME} (a line in the log the take waits for). Every message in and every tool answer is appended to DIR/log.jsonl.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { spawn } from "node:child_process"
import path from "node:path"
import { createInterface } from "node:readline"

const dir = process.argv[2]
mkdirSync(path.join(dir, "go"), { recursive: true })
const log = (o) => appendFileSync(path.join(dir, "log.jsonl"), JSON.stringify(o) + "\n")
const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...m }) + "\n")
let servers = []
const ids = {}
let n = 0
let mcp

function feed() {
  mcp ??= new Promise((ok, no) => {
    const s = servers.find((x) => x.command)
    if (!s) return no(new Error("session/new named no stdio MCP server"))
    const child = spawn(s.command, s.args ?? [], { env: { ...process.env, ...Object.fromEntries((s.env ?? []).map((e) => [e.name, e.value])) }, stdio: ["pipe", "pipe", "inherit"] })
    const waits = new Map()
    let id = 0
    const req = (method, params) => new Promise((done) => { const i = ++id; waits.set(i, done); child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: i, method, params }) + "\n") })
    createInterface({ input: child.stdout }).on("line", (l) => { try { const m = JSON.parse(l); if (m.id && waits.has(m.id)) (waits.get(m.id)(m), waits.delete(m.id)) } catch {} })
    req("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "take", version: "0" } }).then(() => {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n")
      ok({ req })
    })
  })
  return mcp
}
const gate = (name) => new Promise((ok) => { const t = setInterval(() => existsSync(path.join(dir, "go", name)) && (clearInterval(t), ok()), 40) })

// each prompt that isn't the handshake runs the first unused route in DIR/routes.json whose "match" (a regex) finds the
// prompt's words: its "file" is the script. A route marked "again" can run more than once. No route: a one-line reply
// (a goal's check says the goal is met, so a goal never loops), and the turn ends.
let prompts = 0
const said = {}
const used = new Set()
async function run(id, sessionId, text = "") {
  prompts++
  // "$comment" and "$item" in the arguments: the first comment id and item id the prompt names
  said.comment = text.match(/cm-[a-z0-9]+-[a-z0-9]+/)?.[0] ?? said.comment
  said.item = text.match(/i-acp-[a-z0-9]+-\d+/)?.[0] ?? said.item
  const routes = existsSync(path.join(dir, "routes.json")) ? JSON.parse(readFileSync(path.join(dir, "routes.json"), "utf8")) : []
  const check = /\[raea \/goal\] Check/.test(text)
  const route = check ? undefined : routes.find((r, i) => (r.again || !used.has(i)) && new RegExp(r.match, "i").test(text))
  log({ prompt: text.slice(0, 4000), said, route: route?.file ?? null })
  if (!route) {
    // a goal's check answered as a real agent would: what it looked at, then the line raea reads. The words go out a
    // moment before the turn ends, as a real agent's do, so the app has the reply in hand when it sees the stop (sent
    // together, the app asked for a second check after the first was met)
    const met = check ? "I went through version 2 shot by shot, start to finish.\n\nGOAL MET: Goose is in every shot of version 2." : "Done."
    send({ method: "session/update", params: { sessionId, update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: met } } } })
    await new Promise((r) => setTimeout(r, 900))
    send({ id, result: { stopReason: "end_turn" } })
    return
  }
  used.add(routes.indexOf(route))
  const file = route.file
  const steps = JSON.parse(readFileSync(path.join(dir, file), "utf8"))
  for (const s of steps) {
    if (s.gate) await gate(s.gate)
    else if (s.mark) log({ mark: s.mark })
    else if (s.update) send({ method: "session/update", params: { sessionId, update: s.update } })
    else if (s.tool) {
      const f = await feed()
      // "$id:Title" in the arguments is the id of the plan's task with that title, as the last plan_read or plan_add gave it
      const args = JSON.parse(JSON.stringify(s.args ?? {}).replace(/\$id:([^"]+)/g, (_, title) => ids[title] ?? `no-task-${title}`).replace(/\$comment/g, said.comment ?? "no-comment").replace(/\$item/g, said.item ?? "no-item").replace(/\$last/g, said.last ?? "no-last"))
      const r = s.tool === "tools/list" ? await f.req("tools/list", {}) : await f.req("tools/call", { name: s.tool, arguments: args })
      log({ tool: s.tool, args, answer: r })
      const text = r?.result?.content?.[0]?.text ?? ""
      try { const j = JSON.parse(text); if (j.item) (said.last = j.item, log({ posted: j.item })) } catch {}
      try { for (const m of (JSON.parse(text).open ?? "").matchAll(/(t-\w+)\s+[A-Z]+\s+(.+?)(?:\s{2,}.*)?$/gm)) ids[m[2].trim()] = m[1] } catch {}
    }
  }
  send({ id, result: { stopReason: "end_turn" } })
}

createInterface({ input: process.stdin }).on("line", (l) => {
  if (!l.trim()) return
  const m = JSON.parse(l)
  log({ in: m })
  if (m.method === "initialize") send({ id: m.id, result: { protocolVersion: 1, agentCapabilities: {}, agentInfo: { name: "take", title: "Take" }, authMethods: [] } })
  else if (m.method === "session/new") { servers = m.params?.mcpServers ?? []; send({ id: m.id, result: { sessionId: `t-${++n}` } }) }
  else if (m.method === "session/prompt") {
    const text = (m.params?.prompt ?? []).map((b) => b.text ?? "").join("\n")
    if (/Reply with only the word: ready/.test(text)) {
      send({ method: "session/update", params: { sessionId: m.params.sessionId, update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "ready" } } } })
      send({ id: m.id, result: { stopReason: "end_turn" } })
    } else run(m.id, m.params.sessionId, text).catch((e) => (log({ error: String(e) }), send({ id: m.id, result: { stopReason: "end_turn" } })))
  } else if (m.id !== undefined && m.method) send({ id: m.id, result: {} })
})
