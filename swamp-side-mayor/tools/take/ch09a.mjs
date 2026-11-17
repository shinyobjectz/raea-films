// 09 Send it out (1): the film's header: Export pecked (what it opens); Share: the link panel; then Publish, from the
// rail's foot: posts and review links together.
import { cap, chapter, click, hover, key, move, pause, tip, d } from "./tk.mjs"
chapter("09")
const near = async (x0, y0, x1, y1) => { const u = await d.ui(); for (const n of u.nodes) if (n.visible && n.rect.x >= x0 && n.rect.y >= y0 && n.rect.x < x1 && n.rect.y < y1 && !/wave-|clip-|cut-scene|frames-/.test(n.id)) console.log("  ", d.fmt(n)) }
await move(900, 400, 2)
await cap("146-film-header", "The film's header: its name and version, Export and Share at the right")
await hover("media-export", 0, { steps: 4 })
await tip()
await cap("147-export-hover", "Pointer on Export")
await click("media-export")
await pause(1200)
await cap("148-export", "Export open")
console.log("export:"); await near(900, 30, 1600, 600)
await key("Escape")
await pause(600)
await hover("share-button", 0, { steps: 3 })
await tip()
await cap("149-share-hover", "Pointer on Share")
await click("share-button")
await pause(1500)
await cap("150-share-panel", "Share: the link panel")
console.log("share:"); await near(900, 30, 1600, 700)
