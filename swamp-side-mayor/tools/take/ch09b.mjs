// 09 Send it out (2): the film opened again; Share: the link panel; then Publish, from the rail's foot.
import { cap, chapter, click, hover, key, move, node, pause, tip, d } from "./tk.mjs"
chapter("09")
const near = async (x0, y0, x1, y1) => { const u = await d.ui(); for (const n of u.nodes) if (n.visible && n.rect.x >= x0 && n.rect.y >= y0 && n.rect.x < x1 && n.rect.y < y1 && !/wave-|clip-|cut-scene|frames-|^shell|rail-|folder-|project-/.test(n.id)) console.log("  ", d.fmt(n)) }
await click("card-watch")
await node("share-button")
await pause(1500)
await hover("share-button", 0, { steps: 4 })
await tip()
await cap("149-share-hover", "Pointer on Share")
await click("share-button")
await pause(1500)
await cap("150-share-panel", "Share: the link panel")
console.log("share:"); await near(600, 30, 1600, 800)
