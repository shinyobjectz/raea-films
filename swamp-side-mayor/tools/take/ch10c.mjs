import { cap, chapter, click, hover, key, move, node, pause, tip, d } from "./tk.mjs"
const near = async (x0, y0, x1, y1) => { const u = await d.ui(); for (const n of u.nodes) if (n.visible && n.rect.x >= x0 && n.rect.y >= y0 && n.rect.x < x1 && n.rect.y < y1 && !/wave-|clip-|cut-scene|frames-|^shell|rail-|folder-|project-|settings-nav/.test(n.id)) console.log("  ", d.fmt(n)) }
chapter("10")
await key("Escape")
await pause(700)
await hover("settings-nav-fingerprint", 0, { steps: 5 })
await tip()
await cap("158-fingerprint-hover", "Pointer on Fingerprint")
await click("settings-nav-fingerprint")
await pause(1800)
await move(900, 600, 3)
await cap("159-fingerprint", "Settings, Fingerprint")
console.log("fingerprint:"); await near(260, 0, 1600, 900)
