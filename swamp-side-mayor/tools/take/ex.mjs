// exploring: node ex.mjs [click ID [nth] | move X Y | key KEY [mods,..] | text "T" | snap NAME] ... ; then lists the visible ui (or a region with --in x,y,w,h)
import * as d from "./d.mjs"
const a = process.argv.slice(2)
const vis = (u, id, nth = 0) => u.nodes.filter((n) => n.id === id && n.visible)[nth]
let region = null
for (let i = 0; i < a.length; i++) {
  const c = a[i]
  if (c === "click" || c === "hover") {
    const id = a[++i]; const u = await d.wait(id, async () => { const u = await d.ui(); return vis(u, id) && u })
    const n = vis(u, id); const x = n.rect.x + n.rect.w / 2, y = n.rect.y + n.rect.h / 2
    await d.input({ type: "move", x, y })
    if (c === "click") { await d.input({ type: "down", x, y, button: "left", clicks: 1 }); await d.input({ type: "up", x, y, button: "left", clicks: 1 }) }
  } else if (c === "move" || c === "tap") {
    const x = +a[++i], y = +a[++i]; await d.input({ type: "move", x, y })
    if (c === "tap") { await d.input({ type: "down", x, y, button: "left", clicks: 1 }); await d.input({ type: "up", x, y, button: "left", clicks: 1 }) }
  } else if (c === "key") { const key = a[++i]; const mods = a[i + 1] && !["click","hover","move","tap","key","text","snap","--in","wait"].includes(a[i + 1]) ? a[++i].split(",") : []; await d.input({ type: "key", key, mods }) }
  else if (c === "text") await d.input({ type: "text", text: a[++i] })
  else if (c === "wait") { const ms = +a[++i]; await new Promise((ok) => setTimeout(ok, ms)) }
  else if (c === "snap") { try { await d.settled(8000) } catch {} ; await d.png(`out/${a[++i]}.png`) }
  else if (c === "--in") region = a[++i].split(",").map(Number)
}
let u; try { u = await d.settled(8000) } catch { u = await d.ui() }
for (const n of u.nodes) { if (!n.visible) continue; if (region) { const [x, y, w, h] = region; if (n.rect.x + n.rect.w < x || n.rect.x > x + w || n.rect.y + n.rect.h < y || n.rect.y > y + h) continue } console.log(d.fmt(n)) }
