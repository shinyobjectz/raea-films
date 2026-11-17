// v11 (the director on v10, a note: "in 0.1.6 the expand button actually expands it, it's not a drag"): 0.1.6-rc0's
// rail on Everything, its Widen the sidebar button (rail-toggle, at the rail's foot), the rail widened, and folded again
import { cap, chapter, click, hover, move, node, tip, vis, d, pause } from "./tk.mjs"
chapter("01")
await click("rail-home")
await node("inbox-empty").catch(() => console.log("(no inbox-empty)"))
await move(820, 470)
await cap("300-v16-everything", "0.1.6-rc0 on Everything: the rail down the left, its Widen the sidebar button at the foot under the account. Pointer mid-window")
await hover("rail-toggle", 0, { steps: 8 })
await tip()
await cap("301-v16-rail-toggle-hover", "Pointer on the rail's foot: Widen the sidebar")
const before = vis(await d.ui(), "rail-toggle").rect
await click("rail-toggle")
await d.wait("the rail widened", async () => { const n = vis(await d.ui(), "rail-toggle"); return n && n.rect.w > before.w + 20 }, 10000).catch(() => console.log("(rail-toggle width unchanged)"))
await pause(600)
await cap("302-v16-rail-wide", "Widen the sidebar clicked: the rail wide, each project's name beside its mark")
await hover("rail-toggle", 0, { steps: 3 })
await tip()
await cap("303-v16-rail-fold-hover", "Pointer on Fold the sidebar")
await click("rail-toggle")
await d.wait("the rail folded", async () => { const n = vis(await d.ui(), "rail-toggle"); return n && n.rect.w <= before.w + 2 }, 10000).catch(() => console.log("(not folded)"))
await pause(600)
await cap("304-v16-rail-folded", "Fold the sidebar clicked: the rail narrow again")
console.log("rail16 done")
