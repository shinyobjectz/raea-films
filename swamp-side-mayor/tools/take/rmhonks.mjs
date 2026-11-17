// the first take's Honks controller removed through its own menu, so New controller can build it again
import { click, d, gone, pause, vis } from "./tk.mjs"
if (!vis(await d.ui(), "menu-controller-remove")) { await click("controller-menu-honks"); await pause(900) }
await click("menu-controller-remove"); await pause(1000)
let u = await d.ui()
for (const n of u.nodes) if (n.visible && (n.role === "dialog" || n.role === "alertdialog" || /confirm|remove/i.test(n.id))) console.log(d.fmt(n))
const c = u.nodes.find((n) => n.visible && /confirm|dialog-ok|remove-confirm/i.test(n.id) && n.role !== "dialog")
if (c) { await click(c.id); await pause(1000) }
await gone("controller-honks", 15000)
console.log("honks gone")
