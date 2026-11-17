// 09 Send it out (3) and 10 Make it yours: Publish from the rail's foot; then Settings: Agents, New agent; the
// Fingerprint page.
import { cap, chapter, click, hover, key, move, node, pause, tip, d } from "./tk.mjs"
const near = async (x0, y0, x1, y1) => { const u = await d.ui(); for (const n of u.nodes) if (n.visible && n.rect.x >= x0 && n.rect.y >= y0 && n.rect.x < x1 && n.rect.y < y1 && !/wave-|clip-|cut-scene|frames-|^shell|rail-|folder-|project-/.test(n.id)) console.log("  ", d.fmt(n)) }
chapter("09")
await key("Escape")
await pause(500)
await hover("publish", 0, { steps: 5 })
await tip()
await cap("151-publish-hover", "Pointer on Publish, at the rail's foot")
await click("publish")
await pause(2000)
await move(830, 500, 3)
await cap("152-publish", "Publish: posts and review links together, the numbers at the top, what needs you first")
chapter("10")
await hover("open-settings", 0, { steps: 5 })
await tip()
await cap("153-settings-hover", "Pointer on Settings")
await click("open-settings")
await pause(1800)
await move(830, 500, 3)
await cap("154-settings", "Settings")
console.log("settings:"); await near(64, 0, 700, 900)
