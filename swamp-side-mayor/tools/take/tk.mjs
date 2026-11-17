// The take's helpers: a pointer moved, pressed and released over the window's MCP (real input events), and each state
// captured as a PNG, its raw ui and an entry in states.json (the pointer, what it's on, the rects worth aiming at).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import * as d from "./d.mjs"
export { d }

export const S = "/tmp/goose-tut-take"
export const OUT = "projects/swamp-goose/assets/tutorial-app"
export const AGENT = path.join(S, "agent")
export const WS = path.join(S, "home/Documents/raea/my-studio")
mkdirSync(path.join(OUT, "states"), { recursive: true })
mkdirSync(path.join(OUT, "ui"), { recursive: true })
mkdirSync(path.join(AGENT, "go"), { recursive: true })
export const W = { w: 1600, h: 900 }
const SJ = path.join(OUT, "states.json")
const states = existsSync(SJ) ? JSON.parse(readFileSync(SJ, "utf8")) : []
const P = path.join(S, "pointer.json")
export let pointer = existsSync(P) ? JSON.parse(readFileSync(P, "utf8")) : { x: 800, y: 500 }
let held = false
let on = null // the element the pointer was last sent to
export const pause = (ms) => new Promise((ok) => setTimeout(ok, ms))
const r4 = (r) => ({ x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.w.toFixed(1), h: +r.h.toFixed(1) })
export const vis = (u, id, nth = 0) => u.nodes.filter((n) => n.id === id && n.visible)[nth]
export const node = (id, nth = 0, ms = 30000) => d.wait(id, async () => vis(await d.ui(), id, nth), ms)
export const gone = (id, ms = 30000) => d.wait(`${id} gone`, async () => !vis(await d.ui(), id), ms)

export async function move(x, y, steps = 1) {
  const from = { ...pointer }
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, px = from.x + (x - from.x) * t, py = from.y + (y - from.y) * t
    pointer = { x: +px.toFixed(1), y: +py.toFixed(1) }
    await d.input({ type: "move", x: px, y: py })
  }
  writeFileSync(P, JSON.stringify(pointer))
}
export const down = async () => ((held = true), d.input({ type: "down", ...pointer, button: "left", clicks: 1 }))
export const up = async () => ((held = false), d.input({ type: "up", ...pointer, button: "left", clicks: 1 }))
export async function hover(id, nth = 0, { dx = 0, dy = 0, steps = 1 } = {}) {
  const n = await node(id, nth)
  on = id
  await move(n.rect.x + n.rect.w / 2 + dx, n.rect.y + n.rect.h / 2 + dy, steps)
  return n
}
export async function click(id, nth = 0, o = {}) {
  await hover(id, nth, o)
  await down()
  await up()
}
export async function tap(x, y, what = null) {
  on = what
  await move(x, y)
  await down()
  await up()
}
export const key = (k, mods = []) => d.input({ type: "key", key: k, mods })
export const text = (t) => d.input({ type: "text", text: t })
/** types into a field a letter at a time, waiting for each to land; `every`: a capture each N letters (and the last) */
export async function typeInto(id, words, { every = 0, name, about } = {}) {
  const start = (vis(await d.ui(), id)?.value ?? "")
  for (let i = 1; i <= words.length; i++) {
    await text(words[i - 1])
    await d.wait("the letter", async () => (vis(await d.ui(), id)?.value ?? "").endsWith(words.slice(0, i)) || (vis(await d.ui(), id)?.value ?? "") === start + words.slice(0, i), 8000).catch(() => {})
    if (every && (i % every === 0 || i === words.length)) await cap(`${name}-${String(i).padStart(2, "0")}`, `${about}: "${words.slice(0, i)}"`)
  }
}

const ROLES = new Set(["button", "radio", "option", "checkbox", "switch", "menuitem", "tab", "slider", "textbox", "link", "separator", "dialog"])
function rectsOf(u) {
  const out = {}
  for (const n of u.nodes) {
    if (!n.visible || !n.id || n.rect.w <= 0 || n.rect.h <= 0) continue
    if (n.rect.w >= W.w && n.rect.h >= W.h) continue
    if (ROLES.has(n.role) || n.name || /^(shell-|project-|card-|timeline|clip-|bar-|tool-|turn-|feed|composer|new-chat|todo-|control|field-|plugin|settings|index|library|publish|share|export|versions|compare|note|pin|inline)/.test(n.id)) out[n.id] = r4(n.rect)
  }
  return out
}

/** one state: once the interface is still (or as it is, `live`), with its rects; `chapter`: the script's chapter and beat */
export async function cap(name, about, o = {}) {
  // TAKE_NOCAP=1: drive only, writing no capture (a chapter re-run to reach a state, its approved captures kept)
  if (process.env.TAKE_NOCAP) { console.log("(not captured)", name); return await d.ui() }
  if (!o.live) { try { await d.settled(o.settle ?? 15000) } catch {} }
  let buf = await d.pngBuf()
  for (let i = 0; !o.live && i < 25; i++) {
    await pause(120)
    const next = await d.pngBuf()
    const same = next.equals(buf)
    buf = next
    if (same) break
  }
  const u = await d.ui()
  const file = `states/${name}.png`
  writeFileSync(path.join(OUT, file), buf)
  writeFileSync(path.join(OUT, "ui", `${name}.json`), JSON.stringify({ frame: u.frame, window: u.window, nodes: u.nodes.filter((n) => n.visible) }))
  const target = on && vis(u, on) ? { id: on, rect: r4(vis(u, on).rect) } : on ? { id: on } : null
  const entry = { file, about, chapter: o.chapter ?? CH, window: W, pointer: { ...pointer, held }, on: target, input: o.input ?? "real", rects: { ...rectsOf(u), ...(o.rects ?? {}) } }
  const i = states.findIndex((s) => s.file === file)
  if (i >= 0) states[i] = entry
  else states.push(entry)
  states.sort((a, b) => a.file.localeCompare(b.file))
  writeFileSync(SJ, JSON.stringify(states, null, 1))
  console.log(name)
  return u
}
let CH = ""
export const chapter = (c) => (CH = c)

const logLines = () => (existsSync(path.join(AGENT, "log.jsonl")) ? readFileSync(path.join(AGENT, "log.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [])
export const mark = (name, ms = 60000) => d.wait(`the agent's mark ${name}`, async () => logLines().some((l) => l.mark === name), ms)
export const go = (name) => writeFileSync(path.join(AGENT, "go", name), "")
export const posted = () => logLines().filter((l) => l.posted).map((l) => l.posted)
export const tip = () => pause(1300) // a tooltip's delay
