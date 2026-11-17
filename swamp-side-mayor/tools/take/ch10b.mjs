import { cap, chapter, click, hover, key, move, node, pause, tip, d } from "./tk.mjs"
const near = async (x0, y0, x1, y1) => { const u = await d.ui(); for (const n of u.nodes) if (n.visible && n.rect.x >= x0 && n.rect.y >= y0 && n.rect.x < x1 && n.rect.y < y1 && !/wave-|clip-|cut-scene|frames-|^shell|rail-|folder-|project-|settings-nav/.test(n.id)) console.log("  ", d.fmt(n)) }
chapter("10")
await hover("new-agent", 0, { steps: 5 })
await tip()
await cap("156-new-agent-hover", "Pointer on New agent")
await click("new-agent")
await pause(1500)
await cap("157-new-agent", "New agent")
console.log("new agent:"); await near(64, 0, 1600, 900)
