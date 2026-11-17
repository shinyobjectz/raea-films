// driver over the window's MCP: node d.mjs CMD ...
import { writeFileSync } from "node:fs"
const port = 7535
let id = 0
export async function raw(name, args = {}) {
  const r = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }) })
  const j = await r.json()
  if (j.error) throw new Error(`${name}: ${j.error.message}`)
  return j.result
}
export async function call(name, args = {}) {
  const result = await raw(name, args)
  const text = result?.content?.find((c) => c.type === "text")?.text
  try { return text ? JSON.parse(text) : result } catch { return text }
}
export async function png(file) {
  const res = await raw("frame_png")
  const data = res?.content?.find((c) => c.type === "image")?.data
  if (!data) throw new Error("no image " + JSON.stringify(res).slice(0, 300))
  writeFileSync(file, Buffer.from(data, "base64"))
}
export async function pngBuf() {
  const res = await raw("frame_png")
  const data = res?.content?.find((c) => c.type === "image")?.data
  if (!data) throw new Error("no image")
  return Buffer.from(data, "base64")
}
export const input = (ev) => call("input", ev)
export const ui = async () => await call("ui")
export const sleepFrames = async (n = 3) => { for (let i = 0; i < n; i++) await call("state") }
export async function wait(what, check, ms = 30000) {
  const until = Date.now() + ms
  for (;;) { const v = await check(); if (v) return v; if (Date.now() > until) throw new Error("waited for " + what); await new Promise((ok) => setTimeout(ok, 150)) }
}
export const fmt = (n) => `${n.id} [${n.role ?? ""}] ${JSON.stringify((n.name ?? n.text ?? "").slice(0, 60))} ${Math.round(n.rect.x)},${Math.round(n.rect.y)} ${Math.round(n.rect.w)}x${Math.round(n.rect.h)}${n.visible ? "" : " (hidden)"}${n.value != null ? " value=" + JSON.stringify(n.value) : ""}${n.focused ? " focused" : ""}${n.selected ? " selected" : ""}`
if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...a] = process.argv.slice(2)
  if (cmd === "ui") { const u = await ui(); console.log("frame", u.frame, JSON.stringify(u.window)); for (const n of u.nodes) if (a[0] === "all" || n.visible || (n.rect.w > 0 && n.rect.h > 0 && a[0] === "boxed")) console.log(fmt(n)) }
  else if (cmd === "png") await png(a[0])
  else if (cmd === "tools") { const r = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) }); console.log(JSON.stringify((await r.json()).result.tools.map((t) => [t.name, t.inputSchema]), null, 1)) }
  else if (cmd === "in") console.log(JSON.stringify(await input(JSON.parse(a[0]))))
  else console.log(JSON.stringify(await call(cmd, a[0] ? JSON.parse(a[0]) : {}), null, 1).slice(0, 6000))
}
/** the ui once nothing in it moved between two looks 200 ms apart (animations done) */
export async function settled(ms = 15000) {
  const sig = (u) => JSON.stringify(u.nodes.filter((n) => n.visible).map((n) => [n.id, Math.round(n.rect.x), Math.round(n.rect.y), Math.round(n.rect.w), Math.round(n.rect.h), n.value, n.text]))
  const until = Date.now() + ms
  let a = await ui()
  for (;;) {
    await new Promise((ok) => setTimeout(ok, 200))
    const b = await ui()
    if (sig(a) === sig(b)) return b
    if (Date.now() > until) throw new Error("the ui never settled")
    a = b
  }
}
