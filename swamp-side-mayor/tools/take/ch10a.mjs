// 10 Make it yours: Settings, Agents, New agent; then the Fingerprint page.
import { cap, chapter, click, hover, key, move, node, pause, tip, d } from "./tk.mjs"
const near = async (x0, y0, x1, y1) => { const u = await d.ui(); for (const n of u.nodes) if (n.visible && n.rect.x >= x0 && n.rect.y >= y0 && n.rect.x < x1 && n.rect.y < y1 && !/wave-|clip-|cut-scene|frames-|^shell|rail-|folder-|project-|settings-nav/.test(n.id)) console.log("  ", d.fmt(n)) }
chapter("10")
await hover("settings-nav-agents", 0, { steps: 4 })
await tip()
await click("settings-nav-agents")
await pause(1500)
await move(830, 500, 3)
await cap("155-agents", "Settings, Agents")
console.log("agents:"); await near(260, 0, 1600, 900)
